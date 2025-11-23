/**
 * Utilities for detecting duplicate leads and clients
 * Handles name normalization and phone number extraction
 */

/**
 * Normalizes a name for comparison
 * - Converts to lowercase
 * - Removes accents/diacritics
 * - Trims whitespace
 * - Removes extra spaces
 */
export function normalizeName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim()
    .replace(/\s+/g, ' '); // Normalize spaces
}

/**
 * Extracts the last 4 digits from a phone number
 * Handles various formats:
 * - With/without country code (+52, 52, etc.)
 * - With/without area code (lada)
 * - With special characters (-, (), spaces, etc.)
 * 
 * Examples:
 * - "+52 998 123 4567" -> "4567"
 * - "998-123-4567" -> "4567"
 * - "(998) 1234567" -> "4567"
 * - "1234567" -> "4567"
 */
export function extractLast4Digits(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Get last 4 digits
  if (digitsOnly.length >= 4) {
    return digitsOnly.slice(-4);
  }
  
  return digitsOnly;
}

/**
 * Creates a composite key for duplicate detection
 * Format: "normalizedFirstName|normalizedLastName|last4Digits"
 */
export function createDuplicateKey(
  firstName: string,
  lastName: string,
  phone: string | null | undefined
): string {
  const normalizedFirst = normalizeName(firstName);
  const normalizedLast = normalizeName(lastName);
  const last4 = extractLast4Digits(phone);
  
  return `${normalizedFirst}|${normalizedLast}|${last4}`;
}

/**
 * Checks if two duplicate keys match
 */
export function duplicateKeysMatch(key1: string, key2: string): boolean {
  return key1 === key2 && key1 !== '||';  // Avoid matching empty keys
}
