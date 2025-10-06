import DOMPurify from 'isomorphic-dompurify';

const defaultConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target'],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, defaultConfig);
}

export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  textFields: (keyof T)[],
  htmlFields: (keyof T)[] = []
): T {
  const sanitized = { ...obj };
  
  textFields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field] as string) as T[keyof T];
    }
  });
  
  htmlFields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeHtml(sanitized[field] as string) as T[keyof T];
    }
  });
  
  return sanitized;
}
