/**
 * Script to upgrade existing thumbnails to HD quality
 * 
 * This script:
 * 1. Finds all existing media with thumbnails
 * 2. Downloads originals from Google Drive
 * 3. Creates new HD thumbnails (1200x900 @ 90% quality)
 * 4. Uploads to object storage and updates the records
 * 
 * Run with: npx tsx server/scripts/upgradeThumbnailQuality.ts
 */

import { db } from "../db";
import { externalUnitMedia } from "@shared/schema";
import { downloadFileAsBuffer } from "../googleDrive";
import { objectStorageClient } from "../objectStorage";
import sharp from "sharp";
import { eq, isNotNull, and, sql } from "drizzle-orm";

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;

const THUMBNAIL_WIDTH = 1200;
const THUMBNAIL_HEIGHT = 900;
const JPEG_QUALITY = 90;
const BATCH_SIZE = 20;
const DELAY_BETWEEN_BATCHES = 2000;

async function createHDThumbnail(imageBuffer: Buffer): Promise<Buffer> {
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
  contentType: string
): Promise<string> {
  if (!BUCKET_ID) {
    throw new Error("BUCKET_ID not configured");
  }

  const path = `public/external-media/hd/${filename}`;
  
  await objectStorageClient.uploadObject({
    bucketId: BUCKET_ID,
    key: path,
    body: buffer,
    contentType,
  });

  return `/api/public/images/${filename}`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=================================================");
  console.log("  UPGRADE THUMBNAILS TO HD QUALITY");
  console.log(`  Target: ${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT} @ ${JPEG_QUALITY}% JPEG`);
  console.log("=================================================\n");

  if (!BUCKET_ID) {
    console.error("ERROR: DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
    process.exit(1);
  }

  const allMedia = await db
    .select({
      id: externalUnitMedia.id,
      unitId: externalUnitMedia.unitId,
      driveFileId: externalUnitMedia.driveFileId,
      thumbnailUrl: externalUnitMedia.thumbnailUrl,
      fileName: externalUnitMedia.fileName,
    })
    .from(externalUnitMedia)
    .where(and(
      isNotNull(externalUnitMedia.driveFileId),
      isNotNull(externalUnitMedia.thumbnailUrl),
      eq(externalUnitMedia.mediaType, 'photo')
    ));

  console.log(`Found ${allMedia.length} photos to upgrade\n`);

  let processed = 0;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < allMedia.length; i += BATCH_SIZE) {
    const batch = allMedia.slice(i, i + BATCH_SIZE);
    console.log(`\nProcessing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(allMedia.length/BATCH_SIZE)} (${batch.length} photos)...`);

    const promises = batch.map(async (media) => {
      try {
        if (!media.driveFileId) {
          console.log(`  [SKIP] ${media.id} - No Drive file ID`);
          return false;
        }

        const imageBuffer = await downloadFileAsBuffer(media.driveFileId);
        if (!imageBuffer || imageBuffer.length === 0) {
          console.log(`  [SKIP] ${media.id} - Empty download`);
          return false;
        }

        const hdThumbnail = await createHDThumbnail(imageBuffer);
        
        const timestamp = Date.now();
        const filename = `hd_${media.unitId}_${timestamp}_${media.id.slice(-8)}.jpg`;
        
        const newUrl = await uploadToObjectStorage(hdThumbnail, filename, 'image/jpeg');

        await db
          .update(externalUnitMedia)
          .set({ 
            thumbnailUrl: newUrl,
            updatedAt: new Date()
          })
          .where(eq(externalUnitMedia.id, media.id));

        console.log(`  [OK] ${media.id} -> ${filename} (${Math.round(hdThumbnail.length/1024)}KB)`);
        return true;
      } catch (error: any) {
        console.log(`  [ERROR] ${media.id}: ${error.message}`);
        return false;
      }
    });

    const results = await Promise.all(promises);
    const batchSuccess = results.filter(r => r).length;
    const batchFailed = results.filter(r => !r).length;
    
    processed += batch.length;
    success += batchSuccess;
    failed += batchFailed;

    console.log(`  Batch complete: ${batchSuccess} success, ${batchFailed} failed`);
    console.log(`  Progress: ${processed}/${allMedia.length} (${Math.round(processed/allMedia.length*100)}%)`);

    if (i + BATCH_SIZE < allMedia.length) {
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  console.log("\n=================================================");
  console.log("  UPGRADE COMPLETE");
  console.log(`  Total processed: ${processed}`);
  console.log(`  Success: ${success}`);
  console.log(`  Failed: ${failed}`);
  console.log("=================================================");
}

main().catch(console.error);
