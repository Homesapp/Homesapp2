import { db } from "./db";
import { colonies, condominiums, condominiumUnits } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LocationData {
  zona: string;
  condominio: string;
  unidad: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function importLocations() {
  const filePath = path.join(
    __dirname,
    "../attached_assets/Pasted-Zona-Condominio-Unidad-Tumben-kaa-Palma-Central-2-unidades-Region-15-AAK-D3-Region-15-AAK-L1-L-1760361675987_1760361675988.txt"
  );

  console.log("📂 Leyendo archivo:", filePath);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const lines = fileContent.split("\n").filter((line) => line.trim());

  // Skip header line
  const dataLines = lines.slice(1);

  const locations: LocationData[] = [];

  for (const line of dataLines) {
    const parts = line.split("\t").map((p) => p.trim());
    if (parts.length >= 3 && parts[0]) {
      locations.push({
        zona: parts[0],
        condominio: parts[1],
        unidad: parts[2],
      });
    }
  }

  console.log(`📊 Total de registros a procesar: ${locations.length}`);

  // Step 1: Get unique colonies (zonas)
  const uniqueZonas = [...new Set(locations.map((l) => l.zona))];
  console.log(`\n🏘️  Colonias únicas encontradas: ${uniqueZonas.length}`);

  const colonyMap = new Map<string, string>(); // zona name -> colony id

  for (const zona of uniqueZonas) {
    const slug = slugify(zona);
    
    // Check if colony already exists by slug
    const existing = await db
      .select()
      .from(colonies)
      .where(eq(colonies.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      colonyMap.set(zona, existing[0].id);
      console.log(`   ✓ Colonia existente: ${zona}`);
    } else {
      const [newColony] = await db
        .insert(colonies)
        .values({
          name: zona,
          slug: slug,
          active: true,
          approvalStatus: "approved",
        })
        .returning();
      colonyMap.set(zona, newColony.id);
      console.log(`   ✅ Nueva colonia creada: ${zona}`);
    }
  }

  // Step 2: Get unique condominiums
  const uniqueCondos = new Map<string, { zona: string; condominio: string }>();
  
  for (const location of locations) {
    if (location.condominio) {
      const key = `${location.zona}::${location.condominio}`;
      if (!uniqueCondos.has(key)) {
        uniqueCondos.set(key, {
          zona: location.zona,
          condominio: location.condominio,
        });
      }
    }
  }

  console.log(`\n🏢 Condominios únicos encontrados: ${uniqueCondos.size}`);

  const condoMap = new Map<string, string>(); // "zona::condominio" -> condominium id

  for (const [key, data] of uniqueCondos.entries()) {
    const colonyId = colonyMap.get(data.zona);
    if (!colonyId) {
      console.log(`   ⚠️  Colonia no encontrada para: ${data.condominio}`);
      continue;
    }

    // Check if condominium already exists by name only (due to unique constraint)
    const existing = await db
      .select()
      .from(condominiums)
      .where(eq(condominiums.name, data.condominio))
      .limit(1);

    if (existing.length > 0) {
      condoMap.set(key, existing[0].id);
      console.log(`   ✓ Condominio existente: ${data.condominio} (${data.zona})`);
    } else {
      const [newCondo] = await db
        .insert(condominiums)
        .values({
          name: data.condominio,
          colonyId: colonyId,
          zone: data.zona,
          active: true,
          approvalStatus: "approved",
        })
        .returning();
      condoMap.set(key, newCondo.id);
      console.log(`   ✅ Nuevo condominio creado: ${data.condominio} (${data.zona})`);
    }
  }

  // Step 3: Import units in batches
  console.log(`\n🏠 Importando unidades...`);
  
  const unitsToInsert: Array<{ condominiumId: string; unitNumber: string }> = [];
  let unitsSkipped = 0;

  for (const location of locations) {
    if (!location.unidad || !location.condominio) {
      unitsSkipped++;
      continue;
    }

    const key = `${location.zona}::${location.condominio}`;
    const condoId = condoMap.get(key);

    if (!condoId) {
      console.log(`   ⚠️  Condominio no encontrado para unidad: ${location.unidad}`);
      unitsSkipped++;
      continue;
    }

    unitsToInsert.push({
      condominiumId: condoId,
      unitNumber: location.unidad,
    });
  }

  console.log(`   📦 Total de unidades a insertar: ${unitsToInsert.length}`);

  // Batch insert units (50 at a time)
  const batchSize = 50;
  let unitsCreated = 0;
  
  for (let i = 0; i < unitsToInsert.length; i += batchSize) {
    const batch = unitsToInsert.slice(i, i + batchSize);
    
    try {
      await db.insert(condominiumUnits).values(batch).onConflictDoNothing();
      unitsCreated += batch.length;
      console.log(`   📍 Progreso: ${unitsCreated}/${unitsToInsert.length} unidades`);
    } catch (error) {
      console.log(`   ⚠️  Error en batch ${i}-${i + batchSize}:`, error);
    }
  }

  console.log(`\n✅ Importación completada:`);
  console.log(`   📊 Colonias: ${uniqueZonas.length}`);
  console.log(`   📊 Condominios: ${uniqueCondos.size}`);
  console.log(`   📊 Unidades creadas: ${unitsCreated}`);
  console.log(`   📊 Unidades omitidas: ${unitsSkipped}`);
}

// Execute
importLocations()
  .then(() => {
    console.log("\n🎉 Importación exitosa!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error durante la importación:", error);
    process.exit(1);
  });
