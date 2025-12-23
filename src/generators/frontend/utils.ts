import { APIEndpointDefinition } from '../../types/app';

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'text' | 'json';

export function toPascalCase(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal ? pascal.charAt(0).toLowerCase() + pascal.slice(1) : '';
}

export function toKebabCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function singularize(value: string): string {
  if (value.endsWith('ies')) return `${value.slice(0, -3)}y`;
  if (value.endsWith('ses')) return value.slice(0, -2);
  if (value.endsWith('s') && value.length > 1) return value.slice(0, -1);
  return value;
}

export function pluralize(value: string): string {
  if (value.endsWith('y')) return `${value.slice(0, -1)}ies`;
  if (value.endsWith('s')) return `${value}es`;
  return `${value}s`;
}

export function sanitizeIdentifier(value: string): string {
  const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^[0-9]/.test(sanitized)) return `_${sanitized}`;
  return sanitized;
}

export function inferFieldType(field: string): FieldType {
  const lower = field.toLowerCase();

  if (lower === 'id' || lower.endsWith('_id')) return 'string';

  if (lower.startsWith('is_') || lower.startsWith('has_')) {
    return 'boolean';
  }

  if (lower.endsWith('_at') || lower.includes('date') || lower.includes('time')) {
    return 'date';
  }
  if (lower.includes('count') || lower.includes('total') || lower.includes('amount')) {
    return 'number';
  }
  if (lower.includes('content') || lower.includes('description') || lower.includes('body')) {
    return 'text';
  }
  if (lower.includes('metadata') || lower.includes('json')) return 'json';

  return 'string';
}

export function tsTypeForField(fieldType: FieldType): string {
  switch (fieldType) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'string';
    case 'json':
      return 'Record<string, unknown>';
    case 'text':
    case 'string':
    default:
      return 'string';
  }
}

export function generateTypeDefinition(fields: string[], interfaceName = 'GeneratedData'): string {
  const uniqueFields = Array.from(new Set(fields)).filter(Boolean);

  if (uniqueFields.length === 0) {
    return `export interface ${interfaceName} {\n  [key: string]: unknown;\n}`;
  }

  const lines = uniqueFields
    .map((field) => {
      const type = tsTypeForField(inferFieldType(field));
      return `  ${sanitizeIdentifier(field)}: ${type};`;
    })
    .join('\n');

  return `export interface ${interfaceName} {\n${lines}\n}`;
}

export function generateStringTypeDefinition(
  fields: string[],
  interfaceName = 'GeneratedValues'
): string {
  const uniqueFields = Array.from(new Set(fields)).filter(Boolean);

  if (uniqueFields.length === 0) {
    return `export interface ${interfaceName} {\n  [key: string]: string;\n}`;
  }

  const lines = uniqueFields
    .map((field) => `  ${sanitizeIdentifier(field)}: string;`)
    .join('\n');

  return `export interface ${interfaceName} {\n${lines}\n}`;
}

export function generateValidationRules(
  fields: string[],
  valuesTypeName = 'Record<string, unknown>'
): string {
  const uniqueFields = Array.from(new Set(fields)).filter(Boolean);
  const rules = uniqueFields
    .map((field) => {
      const key = sanitizeIdentifier(field);
      return `  if (!values.${key} || String(values.${key}).trim() === '') {\n    nextErrors.${key} = 'This field is required';\n  }`;
    })
    .join('\n\n');

  const errorsShape = uniqueFields
    .map((field) => `    ${sanitizeIdentifier(field)}?: string;`)
    .join('\n');

  const errorsType = uniqueFields.length
    ? `export interface ValidationErrors {\n${errorsShape}\n}`
    : 'export type ValidationErrors = Record<string, string>;';

  return `${errorsType}\n\nexport function validate(values: ${valuesTypeName}): Record<string, string> {\n  const nextErrors: Record<string, string> = {};\n\n${rules || '  return nextErrors;'}\n\n  return nextErrors;\n}`;
}

export function generateStyleTemplate(_componentName: string): string {
  return `.root {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\n.field {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.label {\n  font-size: 14px;\n  font-weight: 600;\n}\n\n.input {\n  padding: 10px 12px;\n  border: 1px solid #d0d5dd;\n  border-radius: 8px;\n  font-size: 14px;\n}\n\n.error {\n  color: #b42318;\n  font-size: 12px;\n}\n\n.actions {\n  display: flex;\n  justify-content: flex-end;\n  gap: 10px;\n}\n\n.buttonPrimary {\n  background: #2563eb;\n  border: 1px solid #1d4ed8;\n  color: #ffffff;\n  padding: 10px 14px;\n  border-radius: 8px;\n  cursor: pointer;\n}\n\n.buttonSecondary {\n  background: #ffffff;\n  border: 1px solid #d0d5dd;\n  color: #101828;\n  padding: 10px 14px;\n  border-radius: 8px;\n  cursor: pointer;\n}`;
}

export function extractPathParams(path: string): string[] {
  const matches = path.matchAll(/:([A-Za-z0-9_]+)/g);
  return Array.from(matches, (m) => m[1]);
}

export function inferResourceFromEndpoint(endpointPath: string): string {
  const cleaned = endpointPath
    .replace(/^\//, '')
    .replace(/^api\//, '')
    .split('/')
    .filter((part) => part && !part.startsWith(':'));

  if (cleaned.length === 0) return 'resource';
  return cleaned[cleaned.length - 1];
}

export function endpointFunctionName(endpoint: APIEndpointDefinition): string {
  const resource = inferResourceFromEndpoint(endpoint.path);
  const params = extractPathParams(endpoint.path);

  const singularResource = singularize(resource);
  const pluralResource = pluralize(singularResource);

  switch (endpoint.method) {
    case 'GET':
      if (params.length > 0) {
        return `${toCamelCase(`get ${singularResource} by ${params.join(' and ')}`)}`;
      }
      return `${toCamelCase(`get ${pluralResource}`)}`;
    case 'POST':
      return `${toCamelCase(`create ${singularResource}`)}`;
    case 'PUT':
      return `${toCamelCase(`update ${singularResource}`)}`;
    case 'PATCH':
      return `${toCamelCase(`patch ${singularResource}`)}`;
    case 'DELETE':
      return `${toCamelCase(`delete ${singularResource}`)}`;
    default:
      return `${toCamelCase(`call ${singularResource}`)}`;
  }
}
