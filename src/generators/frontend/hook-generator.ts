import { APIEndpointDefinition } from '../../types/app';
import {
  endpointFunctionName,
  extractPathParams,
  generateStringTypeDefinition,
  generateValidationRules,
  sanitizeIdentifier,
  toPascalCase,
} from './utils';

export class HookGenerator {
  generateDataFetchHook(endpoint: APIEndpointDefinition): string {
    const functionName = endpointFunctionName(endpoint);
    const hookName = `use${toPascalCase(functionName)}`;

    const pathParams = extractPathParams(endpoint.path);

    const pathParamsTypeName = `${toPascalCase(functionName)}PathParams`;
    const pathParamsType =
      pathParams.length > 0
        ? `export interface ${pathParamsTypeName} {\n${pathParams
            .map((p) => `  ${sanitizeIdentifier(p)}: string;`)
            .join('\n')}\n}`
        : `export type ${pathParamsTypeName} = Record<string, never>;`;

    const needsBody = !['GET', 'DELETE'].includes(endpoint.method);
    const isQueryHook = endpoint.method === 'GET';

    const reactImports = ['useCallback', 'useState'];
    if (isQueryHook) reactImports.push('useEffect');

    const argsSignature = pathParams.length > 0 ? `pathParams: ${pathParamsTypeName}` : '';

    const bodyState = needsBody
      ? `  const [body, setBody] = useState<Record<string, unknown>>({});\n`
      : '';

    const invokeArgs = (() => {
      if (pathParams.length > 0 && needsBody) return 'pathParams, body';
      if (pathParams.length > 0) return 'pathParams';
      if (needsBody) return 'body';
      return '';
    })();

    const invocation = invokeArgs ? `${functionName}(${invokeArgs})` : `${functionName}()`;

    const callbackDeps = [pathParams.length > 0 ? 'pathParams' : '', needsBody ? 'body' : '']
      .filter(Boolean)
      .join(', ');

    const effectBlock = isQueryHook
      ? `\n  useEffect(() => {\n    void run();\n  }, [run]);\n`
      : '';

    const returnBlock = isQueryHook
      ? '  return { data, loading, error, refresh: run };'
      : needsBody
        ? `  return {\n    data,\n    loading,\n    error,\n    body,\n    setBody,\n    run,\n  };`
        : `  return {\n    data,\n    loading,\n    error,\n    run,\n  };`;

    return `import { ${reactImports.join(', ')} } from 'react';\n\nimport { ${functionName} } from '../services/apiClient';\n\n/**\n * ${hookName}\n *\n * A lightweight fetch/mutation hook with loading + error state.\n *\n * For advanced caching/deduplication, consider React Query or SWR.\n */\n${pathParamsType}\n\nexport function ${hookName}(${argsSignature}) {\n  const [data, setData] = useState<unknown>(null);\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n${bodyState}\n  const run = useCallback(async () => {\n    try {\n      setLoading(true);\n      setError(null);\n      const result = await ${invocation};\n      setData(result);\n    } catch (err) {\n      const message = err instanceof Error ? err.message : 'Unknown error';\n      setError(message);\n    } finally {\n      setLoading(false);\n    }\n  }, [${callbackDeps}]);\n${effectBlock}\n${returnBlock}\n}\n`;
  }

  generateFormHook(fields: string[], hookName = 'useGeneratedForm'): string {
    const valuesTypeName = `${toPascalCase(hookName)}Values`;

    const typeDef = generateStringTypeDefinition(fields, valuesTypeName);
    const validation = generateValidationRules(fields, valuesTypeName);

    const defaultValues = fields
      .map((field) => {
        const key = sanitizeIdentifier(field);
        return `    ${key}: '',`;
      })
      .join('\n');

    const defaultValuesBlock =
      fields.length > 0
        ? `{\n${defaultValues}\n  }`
        : `{\n  // Add your default field values\n}`;

    return `import { useMemo, useState } from 'react';\n\n/**\n * ${hookName}\n *\n * A reusable form-state hook with validation.\n */\n${typeDef}\n\n${validation}\n\nconst defaultValues: ${valuesTypeName} = ${defaultValuesBlock};\n\nexport function ${hookName}(initial?: Partial<${valuesTypeName}>) {\n  const [values, setValues] = useState<${valuesTypeName}>(() =>\n    ({\n      ...defaultValues,\n      ...(initial ?? {}),\n    } as ${valuesTypeName})\n  );\n  const [errors, setErrors] = useState<Record<string, string>>({});\n\n  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);\n\n  const setField = <K extends keyof ${valuesTypeName}>(key: K, value: string) => {\n    setValues((prev) => ({ ...prev, [key]: value }));\n  };\n\n  const validateForm = () => {\n    const nextErrors = validate(values);\n    setErrors(nextErrors);\n    return nextErrors;\n  };\n\n  return {\n    values,\n    errors,\n    isValid,\n    setField,\n    validateForm,\n    setValues,\n    setErrors,\n  };\n}\n`;
  }
}
