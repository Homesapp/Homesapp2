import { db } from "../db";
import { externalUnits } from "@shared/schema";
import { parseGoogleMapsUrlWithResolve } from "../googleMapsParser";
import { isNotNull, sql } from "drizzle-orm";

async function fixCoordinates() {
  console.log("Starting coordinate fix script...");
  
  const units = await db
    .select({
      id: externalUnits.id,
      unitNumber: externalUnits.unitNumber,
      googleMapsUrl: externalUnits.googleMapsUrl,
      latitude: externalUnits.latitude,
      longitude: externalUnits.longitude,
    })
    .from(externalUnits)
    .where(isNotNull(externalUnits.googleMapsUrl));

  console.log(`Found ${units.length} units with Google Maps URLs`);

  let updated = 0;
  let errors = 0;
  let unchanged = 0;

  for (const unit of units) {
    if (!unit.googleMapsUrl || unit.googleMapsUrl.trim() === "") {
      continue;
    }

    try {
      const result = await parseGoogleMapsUrlWithResolve(unit.googleMapsUrl);
      
      if (result.success && result.data) {
        const newLat = result.data.latitude;
        const newLng = result.data.longitude;
        
        const latDiff = unit.latitude ? Math.abs(Number(unit.latitude) - newLat) : null;
        const lngDiff = unit.longitude ? Math.abs(Number(unit.longitude) - newLng) : null;
        
        const significantDifference = (latDiff && latDiff > 0.0001) || (lngDiff && lngDiff > 0.0001);
        
        if (significantDifference || !unit.latitude || !unit.longitude) {
          await db
            .update(externalUnits)
            .set({
              latitude: String(newLat),
              longitude: String(newLng),
              locationConfidence: result.data.confidence,
            })
            .where(sql`${externalUnits.id} = ${unit.id}`);
          
          console.log(`Updated ${unit.unitNumber}: (${unit.latitude}, ${unit.longitude}) -> (${newLat}, ${newLng}) [source: ${result.data.source}]`);
          updated++;
        } else {
          unchanged++;
        }
      } else {
        console.log(`Failed to parse URL for ${unit.unitNumber}: ${result.error}`);
        errors++;
      }
    } catch (error) {
      console.error(`Error processing ${unit.unitNumber}:`, error);
      errors++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log("\n=== Summary ===");
  console.log(`Total units processed: ${units.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Errors: ${errors}`);
}

fixCoordinates()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
