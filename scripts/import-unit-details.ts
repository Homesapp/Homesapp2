import { db } from "../server/db";
import { externalUnits, externalCondominiums } from "../shared/schema";
import { eq, and, sql, ilike } from "drizzle-orm";
import * as fs from "fs";

interface UnitData {
  disponible: string;
  zona: string;
  condominio: string;
  unidad: string;
  piso: string;
  tipo: string;
  recamaras: string;
  banos: string;
}

const AGENCY_ID = "6c2c26c5-a268-4451-ae67-8ee56e89b87f";

function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function parseFloor(piso: string): string | null {
  const normalized = normalizeString(piso);
  if (normalized.includes("planta baja") || normalized === "pb") return "planta_baja";
  if (normalized.includes("primer")) return "primer_piso";
  if (normalized.includes("segundo")) return "segundo_piso";
  if (normalized.includes("tercer")) return "tercer_piso";
  if (normalized.includes("penthouse") || normalized.includes("ph")) return "penthouse";
  if (normalized.includes("disponibilidad")) return null;
  return null;
}

function parseTypology(tipo: string, recamaras: string): string | null {
  const normalized = normalizeString(tipo);
  const beds = parseInt(recamaras, 10);
  
  if (normalized === "studio" || normalized.includes("estudio")) {
    return "estudio";
  }
  if (normalized === "loft") {
    return "loft_normal";
  }
  if (!isNaN(beds)) {
    if (beds === 1) return "1_recamara";
    if (beds === 2) return "2_recamaras";
    if (beds >= 3) return "3_recamaras";
  }
  return null;
}

function parsePropertyType(tipo: string): string {
  const normalized = normalizeString(tipo);
  if (normalized === "studio" || normalized.includes("estudio")) return "studio";
  if (normalized === "departamento" || normalized === "depa") return "departamento";
  if (normalized === "casa") return "casa";
  if (normalized === "loft") return "loft";
  if (normalized === "villa") return "villa";
  if (normalized.includes("penthouse") || normalized === "ph" || normalized.includes("studio ph")) return "penthouse";
  return normalized;
}

function parseDisponible(disponible: string): boolean | null {
  const normalized = normalizeString(disponible);
  if (normalized === "disponible") return true;
  if (normalized === "no disponible") return false;
  if (normalized.includes("baja")) return false;
  return null;
}

function parseBedrooms(recamaras: string): number | null {
  const num = parseInt(recamaras, 10);
  if (!isNaN(num)) return num;
  return null;
}

function parseBathrooms(banos: string): number | null {
  const str = banos.replace(",", ".").replace("½", ".5").replace("\r", "");
  const num = parseFloat(str);
  if (!isNaN(num)) return num;
  return null;
}

async function importUnitDetails() {
  console.log("Starting unit details import...");
  
  const filePath = "attached_assets/Pasted-Disponible-Zona-Condominio-Unidad-Piso-Tipo-Rec-maras-Ba-os-Baja-de-listing-Kukulkan-NaiaTulum-C33-1764075430201_1764075430203.txt";
  
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    return;
  }
  
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(line => line.trim());
  
  console.log("Loading condominiums...");
  const condos = await db.select().from(externalCondominiums).where(eq(externalCondominiums.agencyId, AGENCY_ID));
  console.log(`Found ${condos.length} condominiums`);
  
  const condoMap = new Map<string, string>();
  for (const condo of condos) {
    const normalized = normalizeString(condo.name);
    condoMap.set(normalized, condo.id);
    
    const withoutSpaces = normalized.replace(/\s+/g, "");
    condoMap.set(withoutSpaces, condo.id);
  }
  
  console.log("Loading existing units...");
  const existingUnits = await db.select().from(externalUnits).where(eq(externalUnits.agencyId, AGENCY_ID));
  console.log(`Found ${existingUnits.length} existing units`);
  
  const unitsByCondoAndNumber = new Map<string, typeof existingUnits[0]>();
  for (const unit of existingUnits) {
    if (unit.condominiumId) {
      const unitNum = normalizeString(unit.unitNumber);
      const key = `${unit.condominiumId}:${unitNum}`;
      unitsByCondoAndNumber.set(key, unit);
    }
  }
  
  let updatedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  const updates: { id: string; data: any }[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t").map(c => c.replace("\r", ""));
    if (cols.length < 8) continue;
    
    const data: UnitData = {
      disponible: cols[0] || "",
      zona: cols[1] || "",
      condominio: cols[2] || "",
      unidad: cols[3] || "",
      piso: cols[4] || "",
      tipo: cols[5] || "",
      recamaras: cols[6] || "",
      banos: cols[7] || "",
    };
    
    if (!data.condominio || !data.unidad) {
      continue;
    }
    
    let normalizedCondoName = normalizeString(data.condominio);
    let condoId = condoMap.get(normalizedCondoName);
    
    if (!condoId) {
      const withoutSpaces = normalizedCondoName.replace(/\s+/g, "");
      condoId = condoMap.get(withoutSpaces);
    }
    
    if (!condoId) {
      for (const [key, id] of condoMap) {
        if (key.includes(normalizedCondoName) || normalizedCondoName.includes(key)) {
          condoId = id;
          break;
        }
      }
    }
    
    if (!condoId) {
      notFoundCount++;
      continue;
    }
    
    const normalizedUnitNum = normalizeString(data.unidad);
    const key = `${condoId}:${normalizedUnitNum}`;
    let existingUnit = unitsByCondoAndNumber.get(key);
    
    if (!existingUnit) {
      for (const [unitKey, unit] of unitsByCondoAndNumber) {
        if (unitKey.startsWith(condoId + ":")) {
          const storedNum = unitKey.split(":")[1];
          if (storedNum === normalizedUnitNum || 
              storedNum.includes(normalizedUnitNum) || 
              normalizedUnitNum.includes(storedNum)) {
            existingUnit = unit;
            break;
          }
        }
      }
    }
    
    if (!existingUnit) {
      notFoundCount++;
      continue;
    }
    
    const updateData: any = {};
    
    const propertyType = parsePropertyType(data.tipo);
    if (propertyType) updateData.propertyType = propertyType;
    
    const typology = parseTypology(data.tipo, data.recamaras);
    if (typology) updateData.typology = typology;
    
    const floor = parseFloor(data.piso);
    if (floor) updateData.floor = floor;
    
    const bedrooms = parseBedrooms(data.recamaras);
    if (bedrooms !== null) updateData.bedrooms = bedrooms;
    
    const bathrooms = parseBathrooms(data.banos);
    if (bathrooms !== null) updateData.bathrooms = bathrooms;
    
    const isActive = parseDisponible(data.disponible);
    if (isActive !== null) updateData.isActive = isActive;
    
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      updates.push({ id: existingUnit.id, data: updateData });
    }
  }
  
  console.log(`\nProcessing ${updates.length} updates...`);
  
  for (const { id, data } of updates) {
    try {
      await db.update(externalUnits)
        .set(data)
        .where(eq(externalUnits.id, id));
      updatedCount++;
      
      if (updatedCount % 50 === 0) {
        console.log(`Updated ${updatedCount}/${updates.length} units...`);
      }
    } catch (error: any) {
      errorCount++;
      if (errorCount <= 5) {
        console.error(`Error:`, error.message?.substring(0, 100));
      }
    }
  }
  
  console.log("\n=== Import Summary ===");
  console.log(`Total lines processed: ${lines.length - 1}`);
  console.log(`Units updated: ${updatedCount}`);
  console.log(`Units not found: ${notFoundCount}`);
  console.log(`Errors: ${errorCount}`);
}

importUnitDetails()
  .then(() => {
    console.log("\nImport completed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Import failed:", error);
    process.exit(1);
  });
