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
import { eq, isNotNull, and, not, like } from "drizzle-orm";

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;

const THUMBNAIL_WIDTH = 1200;
const THUMBNAIL_HEIGHT = 900;
const JPEG_QUALITY = 90;
const BATCH_SIZE = 5;
const DELAY_BETWEEN_PHOTOS = 500;
const DELAY_BETWEEN_BATCHES = 3000;

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
  contentType: string = 'image/jpeg'
): Promise<string> {
  if (!BUCKET_ID) {
    throw new Error("BUCKET_ID not configured");
  }

  const bucket = objectStorageClient.bucket(BUCKET_ID);
  const objectPath = `public/properties/${filename}`;
  const file = bucket.file(objectPath);
  
  await file.save(buffer, {
    contentType,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  return `/api/public/images/properties/${filename}`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processPhoto(media: {
  id: string;
  unitId: string;
  driveFileId: string | null;
  thumbnailUrl: string | null;
  fileName: string | null;
}): Promise<boolean> {
  try {
    if (!media.driveFileId) {
      console.log(`  [SKIP] ${media.id.slice(-8)} - No Drive file ID`);
      return false;
    }

    const imageBuffer = await downloadFileAsBuffer(media.driveFileId);
    if (!imageBuffer || imageBuffer.length === 0) {
      console.log(`  [SKIP] ${media.id.slice(-8)} - Empty download`);
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

    console.log(`  [OK] ${media.id.slice(-8)} -> ${filename} (${Math.round(hdThumbnail.length/1024)}KB)`);
    return true;
  } catch (error: any) {
    console.log(`  [ERROR] ${media.id.slice(-8)}: ${error.message?.slice(0, 50)}`);
    return false;
  }
}

async function main() {
  console.log("=================================================");
  console.log("  UPGRADE THUMBNAILS TO HD QUALITY");
  console.log(`  Target: ${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT} @ ${JPEG_QUALITY}% JPEG`);
  console.log(`  Batch size: ${BATCH_SIZE}, Delay: ${DELAY_BETWEEN_BATCHES}ms`);
  console.log("=================================================\n");

  if (!BUCKET_ID) {
    console.error("ERROR: DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
    process.exit(1);
  }

  console.log("Fetching photos that need upgrading...");

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
      eq(externalUnitMedia.mediaType, 'photo'),
      not(like(externalUnitMedia.thumbnailUrl, '%/hd_%'))
    ));

  console.log(`Found ${allMedia.length} photos to upgrade\n`);

  if (allMedia.length === 0) {
    console.log("All photos already upgraded!");
    process.exit(0);
  }

  let processed = 0;
  let success = 0;
  let failed = 0;
  const startTime = Date.now();

  const totalBatches = Math.ceil(allMedia.length / BATCH_SIZE);

  for (let i = 0; i < allMedia.length; i += BATCH_SIZE) {
    const batch = allMedia.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    console.log(`\n[Batch ${batchNum}/${totalBatches}] Processing ${batch.length} photos...`);

    for (const media of batch) {
      const result = await processPhoto(media);
      if (result) {
        success++;
      } else {
        failed++;
      }
      processed++;
      
      await sleep(DELAY_BETWEEN_PHOTOS);
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const rate = processed / elapsed;
    const remaining = allMedia.length - processed;
    const eta = Math.round(remaining / rate);

    console.log(`  Batch done: ${success} ok, ${failed} fail | Progress: ${processed}/${allMedia.length} (${Math.round(processed/allMedia.length*100)}%)`);
    console.log(`  Time: ${elapsed}s elapsed, ~${eta}s remaining (~${Math.round(eta/60)} min)`);

    if (i + BATCH_SIZE < allMedia.length) {
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);

  console.log("\n=================================================");
  console.log("  UPGRADE COMPLETE");
  console.log(`  Total processed: ${processed}`);
  console.log(`  Success: ${success}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total time: ${Math.round(totalTime/60)} minutes`);
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Script error:", err);
  process.exit(1);
});
