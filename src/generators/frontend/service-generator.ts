import { APIEndpointDefinition } from '../../types/app';
import {
  endpointFunctionName,
  extractPathParams,
  inferResourceFromEndpoint,
  sanitizeIdentifier,
  singularize,
  toPascalCase,
} from './utils';

export class ServiceGenerator {
  generateAPIService(endpoints: APIEndpointDefinition[]): string {
    const endpointFns = endpoints
      .map((endpoint) => this.generateEndpointFunction(endpoint))
      .filter(Boolean)
      .join('\n\n');

    return `import { API_BASE_URL } from '../config';\n\nexport class APIError extends Error {\n  status: number;\n  body: unknown;\n\n  constructor(message: string, status: number, body: unknown) {\n    super(message);\n    this.status = status;\n    this.body = body;\n  }\n}\n\nexport interface RequestOptions {\n  signal?: AbortSignal;\n  headers?: Record<string, string>;\n}\n\nfunction buildQuery(params?: Record<string, string | number | boolean | undefined>): string {\n  if (!params) return '';\n\n  const search = new URLSearchParams();\n  for (const [key, value] of Object.entries(params)) {\n    if (value === undefined) continue;\n    search.set(key, String(value));\n  }\n\n  const qs = search.toString();\n  return qs ? `?${qs}` : '';\n}\n\nfunction withRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 250): Promise<T> {\n  return fn().catch((err) => {\n    if (retries <= 0) throw err;\n    return new Promise<T>((resolve) => setTimeout(resolve, delayMs)).then(() =>\n      withRetry(fn, retries - 1, delayMs * 2)\n    );\n  });\n}\n\nasync function request<T>(\n  path: string,\n  init: RequestInit,\n  options?: RequestOptions\n): Promise<T> {\n  const response = await fetch(`${API_BASE_URL}${path}`, {\n    ...init,\n    headers: {\n      ...(options?.headers ?? {}),\n      ...(init.headers ?? {}),\n    },\n    signal: options?.signal,\n  });\n\n  const contentType = response.headers.get('content-type');\n  const body = contentType?.includes('application/json') ? await response.json() : await response.text();\n\n  if (!response.ok) {\n    throw new APIError(`API Error: ${response.status} ${response.statusText}`, response.status, body);\n  }\n\n  return body as T;\n}\n\nexport const apiClient = {\n  get<T>(path: string, options?: RequestOptions): Promise<T> {\n    return withRetry(() => request<T>(path, { method: 'GET' }, options));\n  },\n\n  post<T>(path: string, data: unknown, options?: RequestOptions): Promise<T> {\n    return withRetry(() =>\n      request<T>(path, {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify(data),\n      }, options)\n    );\n  },\n\n  put<T>(path: string, data: unknown, options?: RequestOptions): Promise<T> {\n    return withRetry(() =>\n      request<T>(path, {\n        method: 'PUT',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify(data),\n      }, options)\n    );\n  },\n\n  patch<T>(path: string, data: unknown, options?: RequestOptions): Promise<T> {\n    return withRetry(() =>\n      request<T>(path, {\n        method: 'PATCH',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify(data),\n      }, options)\n    );\n  },\n\n  delete<T>(path: string, options?: RequestOptions): Promise<T> {\n    return withRetry(() => request<T>(path, { method: 'DELETE' }, options));\n  },\n};\n\n${endpointFns || '// Add endpoint functions here'}\n`;
  }

  generateEndpointFunction(endpoint: APIEndpointDefinition): string {
    const fnName = endpointFunctionName(endpoint);
    const pascalName = toPascalCase(fnName);

    const pathParams = extractPathParams(endpoint.path);
    const pathParamTypeName = `${pascalName}PathParams`;

    const requestTypeName = `${pascalName}Request`;
    const responseTypeName = `${pascalName}Response`;

    const resource = inferResourceFromEndpoint(endpoint.path);
    const singularResource = singularize(resource);

    const pathParamsType =
      pathParams.length > 0
        ? `export interface ${pathParamTypeName} {\n${pathParams
            .map((p) => `  ${sanitizeIdentifier(p)}: string;`)
            .join('\n')}\n}`
        : `export type ${pathParamTypeName} = Record<string, never>;`;

    const requestShape = endpoint.requestBody
      ? Object.keys(endpoint.requestBody)
          .map((key) => `  ${sanitizeIdentifier(key)}: unknown;`)
          .join('\n')
      : '  [key: string]: unknown;';

    const responseShape = endpoint.responseBody
      ? Object.keys(endpoint.responseBody)
          .map((key) => `  ${sanitizeIdentifier(key)}: unknown;`)
          .join('\n')
      : '  [key: string]: unknown;';

    const requestType =
      endpoint.method === 'GET' || endpoint.method === 'DELETE'
        ? `export type ${requestTypeName} = void;`
        : `export interface ${requestTypeName} {\n${requestShape}\n}`;

    const responseType = `export interface ${responseTypeName} {\n${responseShape}\n}`;

    const pathBuilder = this.generatePathBuilder(
      endpoint.path,
      pathParams,
      pascalName,
      pathParamTypeName
    );

    const queryParamArg =
      endpoint.method === 'GET'
        ? 'queryParams?: Record<string, string | number | boolean | undefined>,'
        : '';

    const bodyArg =
      endpoint.method === 'GET' || endpoint.method === 'DELETE'
        ? ''
        : `body: ${requestTypeName},`;

    const args = [
      pathParams.length > 0 ? `pathParams: ${pathParamTypeName},` : '',
      bodyArg,
      queryParamArg,
      'options?: RequestOptions,'
    ]
      .filter(Boolean)
      .join('\n  ');

    const clientCall = (() => {
      const method = endpoint.method.toLowerCase();
      if (endpoint.method === 'GET') {
        return `return apiClient.get<${responseTypeName}>(path + buildQuery(queryParams), options);`;
      }
      if (endpoint.method === 'DELETE') {
        return `return apiClient.delete<${responseTypeName}>(path, options);`;
      }

      return `return apiClient.${method}<${responseTypeName}>(path, body, options);`;
    })();

    const description = endpoint.description.replace(/\n/g, ' ');

    return `/**\n * ${description}\n */\n${pathParamsType}\n\n${requestType}\n\n${responseType}\n\n${pathBuilder}\n\nexport async function ${fnName}(\n  ${args}\n): Promise<${responseTypeName}> {\n  const path = buildPath${pascalName}(${pathParams.length > 0 ? 'pathParams' : '{} as Record<string, never>'});\n  ${clientCall}\n}\n\n// Convenience alias for resource: ${singularResource}`;
  }

  private generatePathBuilder(
    pathTemplate: string,
    pathParams: string[],
    pascalName: string,
    pathParamTypeName: string
  ): string {
    if (pathParams.length === 0) {
      return `function buildPath${pascalName}(): string {\n  return '${pathTemplate}';\n}`;
    }

    const pathLine = pathTemplate.replace(/:([A-Za-z0-9_]+)/g, (_, paramName: string) => {
      const key = sanitizeIdentifier(paramName);
      return '${encodeURIComponent(pathParams.' + key + ')}';
    });

    return `function buildPath${pascalName}(pathParams: ${pathParamTypeName}): string {\n  return \`${pathLine}\`;\n}`;
  }
}
