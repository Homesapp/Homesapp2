/**
 * Script to clean all existing external unit media and re-import with higher quality
 * 
 * This script:
 * 1. Deletes all existing thumbnails from object storage
 * 2. Clears all external_unit_media records from the database
 * 3. Re-imports all photos from Google Drive with HD quality settings
 * 
 * Run with: npx tsx server/scripts/cleanAndReimportMedia.ts
 */

import { db } from "../db";
import { externalUnits, externalUnitMedia } from "@shared/schema";
import { getGoogleSheetsClient } from "../googleSheets";
import { 
  extractFolderIdFromUrl, 
  listAllMediaInFolder, 
  downloadFileAsBuffer, 
  getVideoEmbedUrl,
  getVideoThumbnailUrl 
} from "../googleDrive";
import { objectStorageClient } from "../objectStorage";
import sharp from "sharp";
import { eq, sql, like } from "drizzle-orm";

const SPREADSHEET_ID = '1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4';
const SHEET_NAME = 'Renta/Long Term';
const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;

// HD Quality settings - targeting ~100-200KB per image, ~2.5-5MB per unit
const THUMBNAIL_WIDTH = 1200;
const THUMBNAIL_HEIGHT = 900;
const JPEG_QUALITY = 90;
const MAX_PRIMARY_PHOTOS = 5;
const MAX_SECONDARY_PHOTOS = 20;
const MAX_PHOTOS_PER_UNIT = MAX_PRIMARY_PHOTOS + MAX_SECONDARY_PHOTOS;
const MAX_VIDEOS_PER_UNIT = 10;

interface DriveMediaData {
  sheetRowId: string;
  unitNumber: string;
  condominiumName: string;
  fichasDriveUrl: string;
  directDriveUrl: string;
}

function extractDriveLinkFromFichas(fichasNotes: string): string | null {
  if (!fichasNotes) return null;
  const patterns = [
    /https:\/\/drive\.google\.com\/(?:drive\/)?folders\/[a-zA-Z0-9_-]+/gi,
    /https:\/\/drive\.google\.com\/(?:open|file\/d)\/[a-zA-Z0-9_-]+/gi,
  ];
  for (const pattern of patterns) {
    const matches = fichasNotes.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0];
    }
  }
  return null;
}

async function readDriveLinksFromSheet(): Promise<DriveMediaData[]> {
  const sheets = await getGoogleSheetsClient();
  
  const valuesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A2:AA`,
  });
  
  const rows = valuesResponse.data.values || [];
  
  const notesResponse = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    ranges: [`'${SHEET_NAME}'!T2:T${rows.length + 1}`],
    includeGridData: true,
  });
  
  const notesData = notesResponse.data.sheets?.[0]?.data?.[0]?.rowData || [];
  
  const notesByRow: { [key: number]: string } = {};
  notesData.forEach((rowData: any, index: number) => {
    if (rowData?.values?.[0]?.note) {
      notesByRow[index] = rowData.values[0].note;
    }
  });
  
  console.log(`Found ${Object.keys(notesByRow).length} cells with notes in column T (FICHAS)`);
  
  return rows.map((row: any[], index: number) => {
    const fichasCellValue = row[19] || '';
    const fichasCellNote = notesByRow[index] || '';
    const directDriveUrl = row[26] || '';
    
    let fichasDriveUrl = extractDriveLinkFromFichas(fichasCellValue);
    if (!fichasDriveUrl) {
      fichasDriveUrl = extractDriveLinkFromFichas(fichasCellNote);
    }
    
    return {
      sheetRowId: row[0] || '',
      unitNumber: row[2] || '',
      condominiumName: row[1] || '',
      fichasDriveUrl: fichasDriveUrl || '',
      directDriveUrl: directDriveUrl,
    };
  }).filter((r: DriveMediaData) => r.sheetRowId && (r.fichasDriveUrl || r.directDriveUrl));
}

async function createThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}

async function uploadToObjectStorage(
  buffer: Buffer, 
  filename: string, 
  contentType: string,
  unitId: string
): Promise<string> {
  if (!BUCKET_ID) {
    throw new Error('BUCKET_ID not configured');
  }
  
  const objectPath = `external-units/${unitId}/media/${filename}`;
  const bucket = objectStorageClient.bucket(BUCKET_ID);
  const file = bucket.file(objectPath);
  
  await file.save(buffer, {
    contentType,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
  
  await file.makePublic();
  
  return `https://storage.googleapis.com/${BUCKET_ID}/${objectPath}`;
}

async function deleteFromObjectStorage(url: string): Promise<boolean> {
  if (!BUCKET_ID || !url) return false;
  
  try {
    const objectPath = url.replace(`https://storage.googleapis.com/${BUCKET_ID}/`, '');
    const bucket = objectStorageClient.bucket(BUCKET_ID);
    const file = bucket.file(objectPath);
    
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to delete from storage: ${url}`, error);
    return false;
  }
}

async function cleanExistingMedia(): Promise<number> {
  console.log('\n=== STEP 1: Cleaning existing media ===');
  
  // Get all existing media records
  const existingMedia = await db
    .select()
    .from(externalUnitMedia);
  
  console.log(`Found ${existingMedia.length} existing media records to clean`);
  
  // Delete thumbnails from object storage
  let deletedCount = 0;
  for (const media of existingMedia) {
    if (media.thumbnailUrl) {
      const deleted = await deleteFromObjectStorage(media.thumbnailUrl);
      if (deleted) deletedCount++;
    }
  }
  
  console.log(`Deleted ${deletedCount} thumbnails from object storage`);
  
  // Delete all media records from database
  const result = await db
    .delete(externalUnitMedia)
    .returning();
  
  console.log(`Deleted ${result.length} media records from database`);
  
  return result.length;
}

async function importMediaForUnit(
  unit: { id: string; sheetRowId: string | null },
  driveData: DriveMediaData
): Promise<{ photos: number; videos: number }> {
  let photosImported = 0;
  let videosImported = 0;
  
  const driveUrl = driveData.fichasDriveUrl || driveData.directDriveUrl;
  if (!driveUrl) return { photos: 0, videos: 0 };
  
  const folderId = extractFolderIdFromUrl(driveUrl);
  if (!folderId) {
    console.log(`  ⚠️ Could not extract folder ID from: ${driveUrl}`);
    return { photos: 0, videos: 0 };
  }
  
  try {
    const mediaFiles = await listAllMediaInFolder(folderId);
    
    const photos = mediaFiles.filter(f => f.mimeType?.startsWith('image/'));
    const videos = mediaFiles.filter(f => f.mimeType?.startsWith('video/'));
    
    // Process photos (up to MAX_PHOTOS_PER_UNIT)
    for (let i = 0; i < Math.min(photos.length, MAX_PHOTOS_PER_UNIT); i++) {
      const photo = photos[i];
      
      try {
        const imageBuffer = await downloadFileAsBuffer(photo.id!);
        if (!imageBuffer) continue;
        
        const thumbnail = await createThumbnail(imageBuffer);
        const filename = `thumb_${photo.id}.jpg`;
        const thumbnailUrl = await uploadToObjectStorage(
          thumbnail,
          filename,
          'image/jpeg',
          unit.id
        );
        
        // Determine section based on index
        const isPrimary = i < MAX_PRIMARY_PHOTOS;
        
        await db.insert(externalUnitMedia).values({
          unitId: unit.id,
          mediaType: 'photo',
          driveFileId: photo.id,
          driveWebViewUrl: photo.webViewLink,
          thumbnailUrl,
          fileName: photo.name,
          mimeType: photo.mimeType,
          fileSize: parseInt(photo.size || '0'),
          status: 'processed',
          displayOrder: i,
          isCover: i === 0,
          isHidden: false,
          manualLabel: isPrimary ? 'cover' : 'other',
          processedAt: new Date(),
        });
        
        photosImported++;
      } catch (err) {
        console.error(`    Error processing photo ${photo.name}:`, err);
      }
    }
    
    // Process videos (up to MAX_VIDEOS_PER_UNIT)
    for (let i = 0; i < Math.min(videos.length, MAX_VIDEOS_PER_UNIT); i++) {
      const video = videos[i];
      
      try {
        const embedUrl = getVideoEmbedUrl(video.id!);
        const thumbnailUrl = getVideoThumbnailUrl(video.id!);
        
        await db.insert(externalUnitMedia).values({
          unitId: unit.id,
          mediaType: 'video',
          driveFileId: video.id,
          driveWebViewUrl: video.webViewLink,
          thumbnailUrl,
          fileName: video.name,
          mimeType: video.mimeType,
          fileSize: parseInt(video.size || '0'),
          status: 'processed',
          displayOrder: MAX_PHOTOS_PER_UNIT + i,
          isCover: false,
          isHidden: false,
          manualLabel: 'other',
          processedAt: new Date(),
        });
        
        videosImported++;
      } catch (err) {
        console.error(`    Error processing video ${video.name}:`, err);
      }
    }
  } catch (error) {
    console.error(`  Error listing media in folder:`, error);
  }
  
  return { photos: photosImported, videos: videosImported };
}

async function reimportAllMedia(): Promise<void> {
  console.log('\n=== STEP 2: Re-importing media from Google Drive ===');
  console.log(`Quality settings: ${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT} @ ${JPEG_QUALITY}% JPEG`);
  console.log(`Max photos per unit: ${MAX_PHOTOS_PER_UNIT} (${MAX_PRIMARY_PHOTOS} primary + ${MAX_SECONDARY_PHOTOS} secondary)`);
  
  // Read Drive links from Google Sheets
  const driveDataList = await readDriveLinksFromSheet();
  console.log(`Found ${driveDataList.length} rows with Drive links in sheet`);
  
  // Get all external units with sheetRowId
  const units = await db
    .select({ id: externalUnits.id, sheetRowId: externalUnits.sheetRowId })
    .from(externalUnits)
    .where(sql`${externalUnits.sheetRowId} IS NOT NULL`);
  
  console.log(`Found ${units.length} units with sheetRowId`);
  
  let totalPhotos = 0;
  let totalVideos = 0;
  let unitsProcessed = 0;
  
  for (const unit of units) {
    const driveData = driveDataList.find(d => d.sheetRowId === unit.sheetRowId);
    
    if (!driveData || (!driveData.fichasDriveUrl && !driveData.directDriveUrl)) {
      continue;
    }
    
    console.log(`\nProcessing unit ${unit.sheetRowId}...`);
    console.log(`  FICHAS URL: ${driveData.fichasDriveUrl || 'none'}`);
    console.log(`  Direct URL: ${driveData.directDriveUrl || 'none'}`);
    
    const { photos, videos } = await importMediaForUnit(unit, driveData);
    
    totalPhotos += photos;
    totalVideos += videos;
    unitsProcessed++;
    
    console.log(`  ✓ Imported ${photos} photos, ${videos} videos`);
    
    // Rate limiting - pause between units to avoid hitting API limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== IMPORT COMPLETE ===');
  console.log(`Units processed: ${unitsProcessed}`);
  console.log(`Total photos imported: ${totalPhotos}`);
  console.log(`Total videos imported: ${totalVideos}`);
  console.log(`Estimated storage: ~${Math.round(totalPhotos * 0.15)} MB (at ~150KB per HD thumbnail)`);
}

async function main() {
  console.log('=================================================');
  console.log('  CLEAN AND RE-IMPORT MEDIA SCRIPT');
  console.log('  HD Quality: 1200x900 @ 90% JPEG');
  console.log('=================================================\n');
  
  if (!BUCKET_ID) {
    console.error('ERROR: DEFAULT_OBJECT_STORAGE_BUCKET_ID not set');
    process.exit(1);
  }
  
  console.log(`Using bucket: ${BUCKET_ID}`);
  
  try {
    // Step 1: Clean existing media
    await cleanExistingMedia();
    
    // Step 2: Re-import all media
    await reimportAllMedia();
    
    console.log('\n✓ Script completed successfully');
  } catch (error) {
    console.error('\n✗ Script failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
