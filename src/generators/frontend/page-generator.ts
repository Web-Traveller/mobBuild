import { pluralize, singularize, toKebabCase, toPascalCase } from './utils';

export class PageGenerator {
  generatePage(name: string, components: string[]): string {
    const pageName = name.endsWith('Page') ? name : `${name}Page`;
    const componentImports = components
      .map((component) => `import { ${component} } from '../components/${component}';`)
      .join('\n');

    const componentRender = components
      .map((component) => `      <${component} />`)
      .join('\n');

    return `import React from 'react';\n\n${componentImports}\n\n/**\n * ${pageName}\n */\nexport const ${pageName}: React.FC = () => {\n  return (\n    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>\n${componentRender || '      {/* Add components here */}'}\n    </div>\n  );\n};\n`;
  }

  generateListPage(tableName: string, componentName?: string, pageName?: string): string {
    const resource = pluralize(singularize(tableName));
    const listComponent = componentName ?? `${toPascalCase(resource)}List`;
    const page = pageName ?? `${listComponent}Page`;

    const itemTypeName = `${toPascalCase(resource)}ListItem`;

    return `import React, { useCallback, useEffect, useState } from 'react';\nimport { useNavigate } from 'react-router-dom';\n\nimport { ${listComponent}, ${itemTypeName} } from '../components/${listComponent}';\nimport { apiClient } from '../services/apiClient';\n\n/**\n * ${page}\n *\n * List page for ${resource}.\n */\nexport const ${page}: React.FC = () => {\n  const navigate = useNavigate();\n  const [items, setItems] = useState<${itemTypeName}[]>([]);\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n\n  const fetchItems = useCallback(async () => {\n    try {\n      setLoading(true);\n      setError(null);\n      const data = await apiClient.get<${itemTypeName}[]>('/api/${resource}');\n      setItems(data);\n    } catch (err) {\n      setError(err instanceof Error ? err.message : 'Unknown error');\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  useEffect(() => {\n    void fetchItems();\n  }, [fetchItems]);\n\n  return (\n    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>\n      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>\n        <h1 style={{ margin: 0 }}>${toPascalCase(resource)}</h1>\n        <button\n          type=\"button\"\n          onClick={() => navigate('/${toKebabCase(resource)}/new')}\n          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d0d5dd' }}\n        >\n          New\n        </button>\n      </div>\n      <${listComponent}\n        items={items}\n        loading={loading}\n        error={error}\n        onSelect={(item) =>\n          navigate('/${toKebabCase(resource)}/' + encodeURIComponent(String(item.id)))\n        }\n      />\n    </div>\n  );\n};\n`;
  }

  generateDetailPage(tableName: string, componentName?: string, pageName?: string): string {
    const resource = pluralize(singularize(tableName));
    const singular = singularize(resource);

    const detailComponent = componentName ?? `${toPascalCase(singular)}Detail`;
    const page = pageName ?? `${detailComponent}Page`;

    const detailTypeName = `${toPascalCase(resource)}DetailData`;

    return `import React, { useCallback, useEffect, useState } from 'react';\nimport { useParams } from 'react-router-dom';\n\nimport { ${detailComponent}, ${detailTypeName} } from '../components/${detailComponent}';\nimport { apiClient } from '../services/apiClient';\n\n/**\n * ${page}\n *\n * Detail page for ${singular}.\n */\nexport const ${page}: React.FC = () => {\n  const params = useParams();\n  const id = params.id;\n\n  const [data, setData] = useState<${detailTypeName} | null>(null);\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n\n  const fetchItem = useCallback(async () => {\n    if (!id) return;\n    try {\n      setLoading(true);\n      setError(null);\n      const result = await apiClient.get<${detailTypeName}>(\n        '/api/${resource}/' + encodeURIComponent(String(id))\n      );\n      setData(result);\n    } catch (err) {\n      setError(err instanceof Error ? err.message : 'Unknown error');\n    } finally {\n      setLoading(false);\n    }\n  }, [id]);\n\n  useEffect(() => {\n    void fetchItem();\n  }, [fetchItem]);\n\n  return (\n    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>\n      <h1 style={{ margin: 0 }}>${toPascalCase(singular)}</h1>\n      <${detailComponent} data={data} loading={loading} error={error} />\n    </div>\n  );\n};\n`;
  }

  generateDashboard(metrics: string[], pageName = 'DashboardPage'): string {
    const cards = metrics
      .map((metric) => {
        const label = toPascalCase(metric).replace(/([a-z])([A-Z])/g, '$1 $2');
        return `      <div style={cardStyle}>\n        <div style={cardLabelStyle}>${label}</div>\n        <div style={cardValueStyle}>--</div>\n      </div>`;
      })
      .join('\n');

    return `import React from 'react';\n\n/**\n * ${pageName}\n *\n * A basic dashboard shell. Replace metrics placeholders with real API-driven data.\n */\nexport const ${pageName}: React.FC = () => {\n  return (\n    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>\n      <h1 style={{ margin: 0 }}>Dashboard</h1>\n      <div style={gridStyle}>\n${cards || '        {/* Add metric cards */}'}\n      </div>\n    </div>\n  );\n};\n\nconst gridStyle: React.CSSProperties = {\n  display: 'grid',\n  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',\n  gap: 16,\n};\n\nconst cardStyle: React.CSSProperties = {\n  border: '1px solid #e4e7ec',\n  borderRadius: 12,\n  padding: 16,\n  background: '#ffffff',\n};\n\nconst cardLabelStyle: React.CSSProperties = {\n  fontSize: 13,\n  fontWeight: 600,\n  color: '#475467',\n};\n\nconst cardValueStyle: React.CSSProperties = {\n  fontSize: 24,\n  fontWeight: 700,\n  color: '#101828',\n  paddingTop: 10,\n};\n`;
  }
}
