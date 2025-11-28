export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

export function generatePropertySlug(condoName: string, unitNumber: string): string {
  const condoSlug = generateSlug(condoName);
  const unitSlug = generateSlug(unitNumber);
  return `${condoSlug}-${unitSlug}`;
}
