/**
 * Template rendering utility for agreement templates
 * Supports variable syntax like {{owner.name}}, {{property.address}}, etc.
 */

interface TemplateContext {
  [key: string]: any;
}

/**
 * Renders a template string by replacing variables with actual values
 * 
 * @param template - Template string with variables in {{key.path}} format
 * @param context - Object containing the data to replace variables with
 * @returns Rendered string with variables replaced
 * 
 * @example
 * const template = "Hello {{user.name}}, your property at {{property.address}} is ready";
 * const context = {
 *   user: { name: "John Doe" },
 *   property: { address: "123 Main St" }
 * };
 * renderTemplate(template, context); 
 * // Returns: "Hello John Doe, your property at 123 Main St is ready"
 */
export function renderTemplate(template: string, context: TemplateContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();
    const value = getNestedValue(context, trimmedPath);
    
    if (value === undefined || value === null) {
      console.warn(`Template variable not found: ${trimmedPath}`);
      return match; // Keep original placeholder if value not found
    }
    
    return String(value);
  });
}

/**
 * Gets a nested value from an object using dot notation
 * 
 * @param obj - Object to extract value from
 * @param path - Dot-separated path like "user.profile.name"
 * @returns The value at the path, or undefined if not found
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

/**
 * Validates a template by checking if all required variables can be resolved
 * 
 * @param template - Template string to validate
 * @param context - Context object with available data
 * @returns Object with validation result and list of missing variables
 */
export function validateTemplate(
  template: string, 
  context: TemplateContext
): { valid: boolean; missingVariables: string[] } {
  const variables = extractVariables(template);
  const missingVariables: string[] = [];
  
  for (const variable of variables) {
    const value = getNestedValue(context, variable);
    if (value === undefined || value === null) {
      missingVariables.push(variable);
    }
  }
  
  return {
    valid: missingVariables.length === 0,
    missingVariables
  };
}

/**
 * Extracts all variable names from a template
 * 
 * @param template - Template string
 * @returns Array of variable names (without {{ }})
 */
export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{([^}]+)\}\}/g);
  return Array.from(matches, match => match[1].trim());
}

/**
 * Creates a context object for property agreement templates
 * 
 * @param data - Data from the property submission and user
 * @returns Context object ready for template rendering
 */
export function createPropertyAgreementContext(data: {
  owner: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    idNumber?: string;
  };
  property: {
    title: string;
    address: string;
    city: string;
    state?: string;
    country?: string;
    zipCode?: string;
    price: number;
    propertyType: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
  agreement: {
    date: string;
    agreementNumber?: string;
  };
}): TemplateContext {
  return {
    owner: {
      name: data.owner.name || '[Nombre del propietario]',
      email: data.owner.email || '[Email del propietario]',
      phone: data.owner.phone || '[Teléfono del propietario]',
      address: data.owner.address || '[Dirección del propietario]',
      idNumber: data.owner.idNumber || '[Número de identificación]',
    },
    property: {
      title: data.property.title || '[Título de la propiedad]',
      address: data.property.address || '[Dirección]',
      city: data.property.city || '[Ciudad]',
      state: data.property.state || '[Estado/Provincia]',
      country: data.property.country || '[País]',
      zipCode: data.property.zipCode || '[Código postal]',
      price: data.property.price ? `$${data.property.price.toLocaleString()}` : '[Precio]',
      propertyType: data.property.propertyType || '[Tipo de propiedad]',
      bedrooms: data.property.bedrooms || '[Habitaciones]',
      bathrooms: data.property.bathrooms || '[Baños]',
      area: data.property.area ? `${data.property.area} m²` : '[Área]',
    },
    agreement: {
      date: data.agreement.date || new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      agreementNumber: data.agreement.agreementNumber || '[Número de acuerdo]',
    },
  };
}
