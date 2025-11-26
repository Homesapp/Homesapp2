import { db } from "../server/db";
import { externalCondominiums, externalUnits } from "../shared/schema";
import { eq, ilike, sql } from "drizzle-orm";

const zoneMapping: Record<string, string> = {
  "Aldea Tulum": "Aldea Tulum",
  "Aldea Zama": "Aldea Zama",
  "Bahia Principe": "Bahía Príncipe",
  "Centro": "Centro",
  "Chemuyil": "Chemuyil",
  "Holistika": "Holistika",
  "Kukulkan": "Kukulkan",
  "La Veleta": "La Veleta",
  "Macario Gomez": "Macario Gómez",
  "Mun Tulum": "Mun Tulum",
  "Playa Del Carmen": "Playa del Carmen",
  "Region 11": "Region 11",
  "Region 12": "Region 12",
  "Region 15": "Region 15",
  "Region 8": "Region 8",
  "Riviera Tulum": "Riviera Tulum",
  "Selva Norte": "Selva Norte",
  "Tumben kaa": "Tumben Kaa",
  "Villas Tulum": "Villas Tulum",
  "Yax-Kin": "Yax-Kin",
  "Zona hotelera": "Zona Hotelera",
  "Av coba": "Av. Cobá",
};

const typologyMapping: Record<string, string> = {
  "Departamento": "Departamento",
  "PentHouse": "PentHouse",
  "Studio": "Studio",
  "studio PH": "Studio PH",
  "Casa": "Casa",
  "Villa": "Villa",
  "TownHouse": "TownHouse",
  "Loft": "Loft",
  "Local Comercial": "Local Comercial",
  "Duplex": "Duplex",
};

const condominiumZones: Record<string, string> = {
  "Aldea Tulum": "Aldea Tulum",
  "Aldea tulum": "Aldea Tulum",
  "Aldea Tulum F2": "Aldea Tulum",
  "Aldea Tulum F3": "Aldea Tulum",
  "Aldea tulum F3": "Aldea Tulum",
  "Mza.22 Ed. R1 Dpto 202": "Aldea Tulum",
  "Mz 65 ed B2 dto 302": "Aldea Tulum",
  "Mza 24 lt1 uc2 C. 302 J2": "Aldea Tulum",
  "Mistiq Tulum": "Kukulkan",
  "Cacao": "La Veleta",
  "Paramar Viva": "Aldea Zama",
  "Quinto Sol": "Aldea Zama",
  "Quinto sol": "Aldea Zama",
  "Ik Zama": "Aldea Zama",
  "Adora": "Kukulkan",
  "Mun Townhouse": "Mun Tulum",
  "Homes": "Villas Tulum",
  "Noil Residences": "Region 15",
  "Villa Tuunich": "Holistika",
  "Selva Norte": "Selva Norte",
  "Amira Central": "Aldea Zama",
  "Amira central": "Aldea Zama",
  "Maria Tulum": "Centro",
  "Maria tulum": "Centro",
  "Kaatal Oox": "La Veleta",
  "Villa Penelopa": "La Veleta",
  "Zona Nove": "La Veleta",
  "Casa Lili": "Riviera Tulum",
  "Seremonia": "La Veleta",
  "Palalma Tierra": "La Veleta",
  "Asana": "La Veleta",
  "Aldea Savia": "Region 12",
  "Aldea Savia F1": "Region 12",
  "Aldea Savia F2": "Region 12",
  "Mistiq Temple I": "Region 15",
  "Mistiq Temple II": "Region 15",
  "Paramar Ve": "Aldea Zama",
  "Tanik Hotel": "La Veleta",
  "Villa Vidrio": "La Veleta",
  "Vientos Tulum": "Aldea Zama",
  "Casa Marta": "Riviera Tulum",
  "Xun Kari": "Yax-Kin",
  "Casa Tigrillo": "Tumben Kaa",
  "Rama": "La Veleta",
  "Casa Amal": "Region 15",
  "Aldea Ka an": "Riviera Tulum",
  "Aldea Ka An": "Riviera Tulum",
  "Solemn": "Region 15",
  "Xamira Fase 1": "La Veleta",
  "Selva Tulum": "La Veleta",
  "Areia": "Region 15",
  "La coordenada perfecta": "Kukulkan",
  "Condos Ocho": "La Veleta",
  "Naia Tulum": "Kukulkan",
  "NaiaTulum": "Kukulkan",
  "Ka An": "Tumben Kaa",
  "Ka An Tulum": "Tumben Kaa",
  "Ware House Black": "Riviera Tulum",
  "Eve Residences": "Aldea Zama",
  "Casa Melodia": "Riviera Tulum",
  "Cuatro Cielos Tulum": "La Veleta",
  "Arba I": "Aldea Zama",
  "Arba II": "Aldea Zama",
  "Arba Ii": "Aldea Zama",
  "Lik Zama": "Aldea Zama",
  "Tuk Tulum": "Centro",
  "Ophelia": "Aldea Zama",
  "Kalmuk": "Centro",
  "Heavens Lagoon": "La Veleta",
  "Tao TSE": "Bahía Príncipe",
  "Tao": "Aldea Zama",
  "Kayum": "Selva Norte",
  "Zama 120": "Aldea Zama",
  "Siddartha": "La Veleta",
  "Casa Ananta": "Region 15",
  "Gautama": "La Veleta",
  "Central Park Lagunas": "La Veleta",
  "Central Park": "La Veleta",
  "Recinto": "Region 8",
  "Villa Lool": "La Veleta",
  "Kantuun": "La Veleta",
  "El Nido": "La Veleta",
  "Kuukum": "Aldea Zama",
  "Miraluna": "Aldea Zama",
  "Anayansi": "Riviera Tulum",
  "Xeiba": "La Veleta",
  "Luna Residence": "Aldea Zama",
  "La Veleta Luxury": "La Veleta",
  "Chaac": "Kukulkan",
  "Casa Pala": "Region 15",
  "Zanza Studios": "La Veleta",
  "Via Aqua": "La Veleta",
  "Luz Tulum": "Tumben Kaa",
  "Xperience Residences": "La Veleta",
  "Riviera": "Riviera Tulum",
  "Alma de Flores": "Aldea Zama",
  "Alma De Flores": "Aldea Zama",
  "Keystone": "Riviera Tulum",
  "Querido Tulum": "Aldea Zama",
  "Palalma Casa": "La Veleta",
  "Carmela": "Aldea Zama",
  "Akua Reserve": "Aldea Zama",
  "Acinte by Endémico": "La Veleta",
  "Acinte By Endémico": "La Veleta",
  "Acinte": "La Veleta",
  "Casa Mono": "Holistika",
  "Amar Tulum": "Holistika",
  "Casa Laguna": "Region 15",
  "Casa Olivia": "Macario Gómez",
  "Casa Sylvia": "Macario Gómez",
  "Erena": "La Veleta",
  "Artia": "Aldea Zama",
  "Koah": "Region 15",
  "Nook": "Region 8",
  "DK Tulum": "La Veleta",
  "Miel y almendras": "Tumben Kaa",
  "Casa Veleta Flores": "La Veleta",
  "Casa Pocahontas": "Riviera Tulum",
  "Naab": "La Veleta",
  "Villa sam": "La Veleta",
  "Zama Tower Premium": "Aldea Zama",
  "Zama Tower": "Aldea Zama",
  "Mama Blue": "Centro",
  "La Privada": "Aldea Zama",
  "Terra Ego": "La Veleta",
  "Casa Nance": "Riviera Tulum",
  "Reverence": "Region 15",
  "Edificio Jabali": "Tumben Kaa",
  "Edifcio Jabali": "Tumben Kaa",
  "Villa G": "Aldea Zama",
  "Casa Venado": "Tumben Kaa",
  "Bakal": "Centro",
  "Santal": "La Veleta",
  "The secret garden": "La Veleta",
  "Casa Risueña": "Holistika",
  "Casa Risueña PB": "Holistika",
  "Casa Risueña PA": "Holistika",
  "Aflora": "Aldea Zama",
  "Condo Los amigos 3": "La Veleta",
  "Smart depas": "La Veleta",
  "Smart Depas": "La Veleta",
  "Panoramic": "La Veleta",
  "Hacienda Tuuk Torre Yah": "Centro",
  "Zen": "La Veleta",
  "Blue Luxury": "La Veleta",
  "Blue Luxury Kukulkan": "Kukulkan",
  "Casa armonia": "La Veleta",
  "Playazul": "Playa del Carmen",
  "Halaken": "La Veleta",
  "Edena by TAO": "Av. Cobá",
  "Edena by Tao": "Av. Cobá",
  "Gardens by Coba": "Av. Cobá",
  "Gardens by coba": "Av. Cobá",
  "Rosa de Plata": "La Veleta",
  "Muuk": "Region 15",
  "Kasa Mate": "La Veleta",
  "Cordelia": "La Veleta",
  "Surya": "La Veleta",
  "Kanta": "La Veleta",
  "Heaven": "La Veleta",
  "Xintok": "La Veleta",
  "Atipika": "La Veleta",
  "Gaia": "Aldea Zama",
  "Tzunum": "La Veleta",
  "Agua de mar": "Aldea Zama",
  "Agua de Mar": "Aldea Zama",
  "Casa Chemuyil": "Chemuyil",
  "Xiimbal": "La Veleta",
  "Waves": "Kukulkan",
  "Brava Towers": "Aldea Zama",
  "Chen": "Aldea Zama",
  "Lighthouse": "La Veleta",
  "Elementus": "La Veleta",
  "Luxury Apartment": "Aldea Zama",
  "Habitaciones": "Zona Hotelera",
  "Restaurant": "Zona Hotelera",
  "Local comercial": "Zona Hotelera",
  "Hibisco": "Selva Norte",
  "Akua Tulum": "Aldea Zama",
  "Rosa de Piedra": "La Veleta",
  "Mistiq Gardens I": "Region 15",
  "Mistiq Gardens II": "Region 15",
  "Mistiq Gardens": "Region 15",
  "Downtown": "Bahía Príncipe",
  "Beel 19": "Playa del Carmen",
  "Casa Boho": "Centro",
  "Allegranza": "La Veleta",
  "Ahal 1": "Region 15",
  "Ahal 2": "Region 15",
  "Ahal 3": "Region 15",
  "Aak": "La Veleta",
  "Aguasanta": "Aldea Zama",
  "Amelia": "La Veleta",
  "Amira District": "Aldea Zama",
  "Anah Suites": "Aldea Zama",
  "Anah Village": "Aldea Zama",
  "Angelique": "Aldea Zama",
  "Art House": "Centro",
  "Aru Tulum": "Aldea Zama",
  "Asana Leaf": "La Veleta",
  "Atia": "Aldea Zama",
  "Atman Residences": "La Veleta",
  "Azara": "La Veleta",
  "Baay": "Aldea Zama",
  "Balba": "La Veleta",
  "Almendro": "Holistika",
  "Alma": "Aldea Zama",
  "Mistiq Villas": "Kukulkan",
  "Mistiq Premium": "Kukulkan",
};

async function updateCondominiumZones() {
  console.log("Starting condominium zone updates...");
  
  const condos = await db.select().from(externalCondominiums);
  console.log(`Found ${condos.length} condominiums to process`);
  
  let updated = 0;
  let skipped = 0;
  const unmapped: string[] = [];
  
  for (const condo of condos) {
    let zone: string | null = null;
    
    if (condominiumZones[condo.name]) {
      zone = condominiumZones[condo.name];
    } else {
      const normalizedName = condo.name.toLowerCase().trim();
      for (const [key, value] of Object.entries(condominiumZones)) {
        if (key.toLowerCase().trim() === normalizedName) {
          zone = value;
          break;
        }
      }
    }
    
    if (zone) {
      if (condo.zone !== zone) {
        await db.update(externalCondominiums)
          .set({ zone })
          .where(eq(externalCondominiums.id, condo.id));
        updated++;
        console.log(`Updated "${condo.name}" -> Zone: "${zone}"`);
      } else {
        skipped++;
      }
    } else {
      unmapped.push(condo.name);
    }
  }
  
  console.log(`\nCondominium Zone Update Summary:`);
  console.log(`- Updated: ${updated}`);
  console.log(`- Already correct: ${skipped}`);
  console.log(`- Unmapped: ${unmapped.length}`);
  
  if (unmapped.length > 0) {
    console.log(`\nUnmapped condominiums:`);
    unmapped.forEach(name => console.log(`  - ${name}`));
  }
}

async function main() {
  try {
    await updateCondominiumZones();
    console.log("\n✅ Zone update completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating zones:", error);
    process.exit(1);
  }
}

main();
