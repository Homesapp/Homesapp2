/**
 * Utility to parse owner contacts from CSV with intelligent name parsing
 * 
 * Expected contact format from phone:
 * "Nombre dueño Condominio 101 ref María"
 * 
 * Examples:
 * - "Juan Pérez dueño Aldea Zama A-101 ref María González"
 * - "María Lopez dueno Tulum Country Club 205"
 * - "Carlos Ruiz dueño Holistika PH-1 ref Ana"
 */

export interface ParsedContact {
  ownerName: string;
  condominiumName: string;
  unitNumber: string;
  referralName?: string;
  phoneNumber?: string;
  email?: string;
  rawName: string;
  parseSuccess: boolean;
  parseError?: string;
}

/**
 * Parse contact name using the pattern: "Name dueño Condo Unit ref Referral"
 */
export function parseContactName(rawName: string): Omit<ParsedContact, 'phoneNumber' | 'email'> {
  const result: Omit<ParsedContact, 'phoneNumber' | 'email'> = {
    ownerName: '',
    condominiumName: '',
    unitNumber: '',
    referralName: undefined,
    rawName,
    parseSuccess: false,
  };

  try {
    // Normalize: trim and collapse multiple spaces
    const normalized = rawName.trim().replace(/\s+/g, ' ');
    
    // Pattern 1: Check for "dueño" or "dueno" (case insensitive)
    const ownerMarkerRegex = /\b(due[nñ]o)\b/i;
    const ownerMarkerMatch = normalized.match(ownerMarkerRegex);
    
    if (!ownerMarkerMatch) {
      result.parseError = 'No se encontró la palabra "dueño" en el nombre';
      return result;
    }

    const ownerMarkerIndex = ownerMarkerMatch.index!;
    
    // Extract owner name (everything before "dueño")
    result.ownerName = normalized.substring(0, ownerMarkerIndex).trim();
    
    if (!result.ownerName) {
      result.parseError = 'No se pudo extraer el nombre del propietario';
      return result;
    }

    // Get the rest after "dueño"
    const afterOwnerMarker = normalized.substring(ownerMarkerIndex + ownerMarkerMatch[0].length).trim();
    
    // Pattern 2: Check for "ref" (optional referral)
    const refMarkerRegex = /\bref\b/i;
    const refMarkerMatch = afterOwnerMarker.match(refMarkerRegex);
    
    let condoAndUnit = afterOwnerMarker;
    
    if (refMarkerMatch) {
      // Extract referral name (everything after "ref")
      const refMarkerIndex = refMarkerMatch.index!;
      result.referralName = afterOwnerMarker.substring(refMarkerIndex + refMarkerMatch[0].length).trim();
      
      // Condo and unit is everything between "dueño" and "ref"
      condoAndUnit = afterOwnerMarker.substring(0, refMarkerIndex).trim();
    }

    // Pattern 3: Extract unit number (last "word" that looks like a unit)
    // Unit patterns: 101, A-101, PH-1, 1A, Tower 1-305, etc.
    const unitPattern = /\b([A-Z]+-?\d+[A-Z]?|\d+[A-Z]?|\d+-\d+[A-Z]?|[A-Z]+\s*\d+[A-Z]?-?\d*)\s*$/i;
    const unitMatch = condoAndUnit.match(unitPattern);
    
    if (!unitMatch) {
      result.parseError = 'No se pudo extraer el número de unidad';
      return result;
    }

    result.unitNumber = unitMatch[1].trim();
    
    // Extract condominium name (everything before unit number)
    result.condominiumName = condoAndUnit.substring(0, unitMatch.index!).trim();
    
    if (!result.condominiumName) {
      result.parseError = 'No se pudo extraer el nombre del condominio';
      return result;
    }

    result.parseSuccess = true;
    
  } catch (error: any) {
    result.parseError = `Error al parsear: ${error.message}`;
  }

  return result;
}

/**
 * Parse a CSV row into a contact object
 */
export function parseContactRow(row: any): ParsedContact {
  // CSV columns vary, but typically: Name, Phone, Email (or similar)
  // We'll try to extract from common column names
  const name = row['Name'] || row['name'] || row['Nombre'] || row['nombre'] || row['Given Name'] || '';
  const phone = row['Phone'] || row['phone'] || row['Teléfono'] || row['telefono'] || row['Phone 1 - Value'] || '';
  const email = row['Email'] || row['email'] || row['E-mail'] || row['E-mail 1 - Value'] || '';

  const parsed = parseContactName(name);

  return {
    ...parsed,
    phoneNumber: phone || undefined,
    email: email || undefined,
  };
}

/**
 * Validate if a contact has minimum required data
 */
export function isValidContact(contact: ParsedContact): boolean {
  return (
    contact.parseSuccess &&
    !!contact.ownerName &&
    !!contact.condominiumName &&
    !!contact.unitNumber
  );
}

/**
 * Clean and normalize phone number
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except + at the start
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +52, keep it
  if (cleaned.startsWith('+52')) {
    return cleaned;
  }
  
  // If it starts with 52 (without +), add the +
  if (cleaned.startsWith('52') && cleaned.length > 10) {
    return '+' + cleaned;
  }
  
  // If it's a 10-digit Mexican number, add +52
  if (cleaned.length === 10) {
    return '+52' + cleaned;
  }
  
  // Otherwise return as is
  return cleaned;
}
