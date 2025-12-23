import {
  generateStringTypeDefinition,
  generateStyleTemplate,
  generateValidationRules,
  sanitizeIdentifier,
  toPascalCase,
} from './utils';

export type ComponentType = 'form' | 'list' | 'detail' | 'card';

export class ComponentGenerator {
  generateComponent(name: string, type: ComponentType): string {
    const componentName = toPascalCase(name);

    switch (type) {
      case 'form':
        return this.generateFormComponent([], componentName);
      case 'list':
        return this.generateListComponent(componentName, ['id'], componentName);
      case 'detail':
        return this.generateDetailComponent(componentName, ['id'], componentName);
      case 'card':
      default:
        return this.generateCardComponent([], componentName);
    }
  }

  generateFormComponent(fields: string[], componentName = 'GeneratedForm'): string {
    const valuesTypeName = `${componentName}Values`;

    const typeDef = generateStringTypeDefinition(fields, valuesTypeName);
    const validation = generateValidationRules(fields, valuesTypeName);

    const defaultValues = fields
      .map((field) => {
        const key = sanitizeIdentifier(field);
        return `  ${key}: '',`;
      })
      .join('\n');

    const fieldInputs = fields
      .map((field) => {
        const key = sanitizeIdentifier(field);
        const label = toPascalCase(field).replace(/([a-z])([A-Z])/g, '$1 $2');

        return `      <div className={styles.field}>\n        <label className={styles.label} htmlFor=\"${key}\">\n          ${label}\n        </label>\n        <input\n          id=\"${key}\"\n          className={styles.input}\n          value={values.${key}}\n          onChange={(e) => handleChange('${key}', e.target.value)}\n          aria-invalid={Boolean(errors.${key})}\n        />\n        {errors.${key} ? <div className={styles.error}>{errors.${key}}</div> : null}\n      </div>`;
      })
      .join('\n\n');

    const defaultValuesBlock =
      fields.length > 0
        ? `const defaultValues: ${valuesTypeName} = {\n${defaultValues}\n};`
        : `const defaultValues: ${valuesTypeName} = {};`;

    return `import React, { useMemo, useState } from 'react';\n\nimport styles from './${componentName}.module.css';\n\n/**\n * ${componentName}\n *\n * Production-ready form component with validation and loading state.\n */\n${typeDef}\n\nexport interface ${componentName}Props {\n  onSubmit?: (data: ${valuesTypeName}) => Promise<void> | void;\n  onCancel?: () => void;\n  submitLabel?: string;\n  initialValues?: Partial<${valuesTypeName}>;\n}\n\n${validation}\n\n${defaultValuesBlock}\n\nexport const ${componentName}: React.FC<${componentName}Props> = ({\n  onSubmit,\n  onCancel,\n  submitLabel = 'Save',\n  initialValues,\n}) => {\n  const [values, setValues] = useState<${valuesTypeName}>(() =>\n    ({\n      ...defaultValues,\n      ...(initialValues ?? {}),\n    } as ${valuesTypeName})\n  );\n  const [errors, setErrors] = useState<Record<string, string>>({});\n  const [loading, setLoading] = useState(false);\n\n  const canSubmit = useMemo(() => Object.keys(errors).length === 0, [errors]);\n\n  const handleChange = <K extends keyof ${valuesTypeName}>(key: K, value: string) => {\n    setValues((prev) => ({ ...prev, [key]: value }));\n  };\n\n  const handleSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n\n    const nextErrors = validate(values);\n    setErrors(nextErrors);\n\n    if (Object.keys(nextErrors).length > 0) return;\n\n    try {\n      setLoading(true);\n      await onSubmit?.(values);\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  return (\n    <form className={styles.root} onSubmit={handleSubmit}>\n${fieldInputs || '      {/* Add form fields here */}'}\n\n      <div className={styles.actions}>\n        {onCancel ? (\n          <button\n            type=\"button\"\n            className={styles.buttonSecondary}\n            onClick={onCancel}\n            disabled={loading}\n          >\n            Cancel\n          </button>\n        ) : null}\n        <button type=\"submit\" className={styles.buttonPrimary} disabled={loading || !canSubmit}>\n          {loading ? 'Saving...' : submitLabel}\n        </button>\n      </div>\n    </form>\n  );\n};\n`;
  }

  generateListComponent(
    tableName: string,
    fields: string[],
    componentName = `${toPascalCase(tableName)}List`
  ): string {
    const itemTypeName = `${toPascalCase(tableName)}ListItem`;
    const typeDef = generateStringTypeDefinition(fields.length > 0 ? fields : ['id'], itemTypeName);

    const columns = (fields.length > 0 ? fields : ['id'])
      .map((field) => {
        const label = toPascalCase(field).replace(/([a-z])([A-Z])/g, '$1 $2');
        return `          <th style={headerCellStyle}>${label}</th>`;
      })
      .join('\n');

    const cells = (fields.length > 0 ? fields : ['id'])
      .map((field) => {
        const key = sanitizeIdentifier(field);
        return `            <td style={cellStyle}>{item.${key}}</td>`;
      })
      .join('\n');

    return `import React from 'react';\n\n/**\n * ${componentName}\n *\n * A simple list/table view with selection support.\n */\n${typeDef}\n\nexport interface ${componentName}Props {\n  items: ${itemTypeName}[];\n  loading?: boolean;\n  error?: string | null;\n  onSelect?: (item: ${itemTypeName}) => void;\n}\n\nconst tableStyle: React.CSSProperties = {\n  width: '100%',\n  borderCollapse: 'collapse',\n};\n\nconst headerCellStyle: React.CSSProperties = {\n  textAlign: 'left',\n  padding: '10px 12px',\n  borderBottom: '1px solid #e4e7ec',\n  fontSize: 13,\n  color: '#475467',\n};\n\nconst cellStyle: React.CSSProperties = {\n  padding: '10px 12px',\n  borderBottom: '1px solid #f2f4f7',\n  fontSize: 14,\n};\n\nexport const ${componentName}: React.FC<${componentName}Props> = ({\n  items,\n  loading = false,\n  error = null,\n  onSelect,\n}) => {\n  if (loading) return <div>Loading...</div>;\n  if (error) return <div role=\"alert\">{error}</div>;\n\n  if (!items || items.length === 0) {\n    return <div>No results found.</div>;\n  }\n\n  return (\n    <table style={tableStyle}>\n      <thead>\n        <tr>\n${columns}\n        </tr>\n      </thead>\n      <tbody>\n        {items.map((item, idx) => (\n          <tr\n            key={String(item.id ?? idx)}\n            onClick={() => onSelect?.(item)}\n            style={{ cursor: onSelect ? 'pointer' : 'default' }}\n          >\n${cells}\n          </tr>\n        ))}\n      </tbody>\n    </table>\n  );\n};\n`;
  }

  generateDetailComponent(
    tableName: string,
    fields: string[],
    componentName = `${toPascalCase(tableName)}Detail`
  ): string {
    const itemTypeName = `${toPascalCase(tableName)}DetailData`;
    const typeDef = generateStringTypeDefinition(fields.length > 0 ? fields : ['id'], itemTypeName);

    const rows = (fields.length > 0 ? fields : ['id'])
      .map((field) => {
        const key = sanitizeIdentifier(field);
        const label = toPascalCase(field).replace(/([a-z])([A-Z])/g, '$1 $2');
        return `      <div style={rowStyle}>\n        <div style={labelStyle}>${label}</div>\n        <div style={valueStyle}>{data.${key}}</div>\n      </div>`;
      })
      .join('\n');

    return `import React from 'react';\n\n/**\n * ${componentName}\n *\n * A detail view for a single record.\n */\n${typeDef}\n\nexport interface ${componentName}Props {\n  data: ${itemTypeName} | null;\n  loading?: boolean;\n  error?: string | null;\n}\n\nconst containerStyle: React.CSSProperties = {\n  border: '1px solid #e4e7ec',\n  borderRadius: 12,\n  padding: 16,\n};\n\nconst rowStyle: React.CSSProperties = {\n  display: 'grid',\n  gridTemplateColumns: '160px 1fr',\n  gap: 16,\n  padding: '10px 0',\n  borderBottom: '1px solid #f2f4f7',\n};\n\nconst labelStyle: React.CSSProperties = {\n  fontWeight: 600,\n  color: '#475467',\n  fontSize: 13,\n};\n\nconst valueStyle: React.CSSProperties = {\n  fontSize: 14,\n  color: '#101828',\n};\n\nexport const ${componentName}: React.FC<${componentName}Props> = ({ data, loading = false, error }) => {\n  if (loading) return <div>Loading...</div>;\n  if (error) return <div role=\"alert\">{error}</div>;\n  if (!data) return <div>Not found.</div>;\n\n  return <div style={containerStyle}>\n${rows}\n  </div>;\n};\n`;
  }

  generateCardComponent(fields: string[], componentName = 'GeneratedCard'): string {
    const dataTypeName = `${componentName}Data`;
    const typeDef = generateStringTypeDefinition(
      fields.length > 0 ? fields : ['label', 'value'],
      dataTypeName
    );

    const rows = (fields.length > 0 ? fields : ['label', 'value'])
      .map((field) => {
        const key = sanitizeIdentifier(field);
        const label = toPascalCase(field).replace(/([a-z])([A-Z])/g, '$1 $2');
        return `        <div style={rowStyle}>\n          <div style={rowLabelStyle}>${label}</div>\n          <div style={rowValueStyle}>{data.${key}}</div>\n        </div>`;
      })
      .join('\n');

    return `import React from 'react';\n\n/**\n * ${componentName}\n *\n * A reusable card component for dashboard-like displays.\n */\n${typeDef}\n\nexport interface ${componentName}Props {\n  title: string;\n  data: ${dataTypeName};\n}\n\nconst containerStyle: React.CSSProperties = {\n  border: '1px solid #e4e7ec',\n  borderRadius: 12,\n  padding: 16,\n  background: '#ffffff',\n};\n\nconst titleStyle: React.CSSProperties = {\n  margin: 0,\n  fontSize: 14,\n  color: '#475467',\n  fontWeight: 600,\n};\n\nconst rowStyle: React.CSSProperties = {\n  display: 'flex',\n  justifyContent: 'space-between',\n  paddingTop: 10,\n};\n\nconst rowLabelStyle: React.CSSProperties = {\n  color: '#667085',\n  fontSize: 13,\n};\n\nconst rowValueStyle: React.CSSProperties = {\n  color: '#101828',\n  fontSize: 14,\n  fontWeight: 600,\n};\n\nexport const ${componentName}: React.FC<${componentName}Props> = ({ title, data }) => {\n  return (\n    <section style={containerStyle}>\n      <h3 style={titleStyle}>{title}</h3>\n      <div>\n${rows}\n      </div>\n    </section>\n  );\n};\n`;
  }

  generateComponentStyles(componentName: string): string {
    return generateStyleTemplate(componentName);
  }
}
