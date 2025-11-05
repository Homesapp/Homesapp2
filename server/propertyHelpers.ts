import type { Property } from "@shared/schema";

export function getPropertyTitle(property: Property | null | undefined): string {
  if (!property) {
    return "Propiedad";
  }

  // Use condoName (the actual field in the database) instead of condominiumName
  if (property.condoName && property.unitNumber) {
    return `${property.condoName} - ${property.unitNumber}`;
  }

  // If only unit number exists
  if (property.unitNumber) {
    return `Unidad ${property.unitNumber}`;
  }

  // If only condo name exists
  if (property.condoName) {
    return property.condoName;
  }

  // Final fallback
  return "Propiedad";
}
