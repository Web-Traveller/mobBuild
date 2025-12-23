import {
  AppRequirement,
  OrchestrationContext,
  TableDefinition,
  UIComponentDefinition,
} from '../../types/app';
import { OrchestrationCodeGenerator } from '../../types/generator';
import { logger } from '../../utils/logger';
import { ComponentGenerator } from './component-generator';
import { HookGenerator } from './hook-generator';
import { PageGenerator } from './page-generator';
import { ServiceGenerator } from './service-generator';
import { StructureGenerator } from './structure-generator';
import { FrontendValidator } from './validator';
import {
  endpointFunctionName,
  inferResourceFromEndpoint,
  pluralize,
  sanitizeIdentifier,
  singularize,
  toKebabCase,
  toPascalCase,
} from './utils';

export interface GeneratedRoute {
  path: string;
  componentName: string;
  filePath: string;
  navLabel?: string;
  showInNav?: boolean;
}

/**
 * FrontendGenerator
 *
 * Produces a production-ready React + TypeScript frontend scaffold:
 * - Project structure (Vite + React Router)
 * - Services (typed API client + endpoint functions)
 * - Hooks (data fetching/mutation + form hooks)
 * - Components (forms, lists, detail views)
 * - Pages and routing configuration
 */
export class FrontendGenerator implements OrchestrationCodeGenerator {
  name = 'frontend-generator' as const;

  private readonly componentGenerator = new ComponentGenerator();
  private readonly pageGenerator = new PageGenerator();
  private readonly serviceGenerator = new ServiceGenerator();
  private readonly hookGenerator = new HookGenerator();
  private readonly structureGenerator = new StructureGenerator();
  private readonly validator = new FrontendValidator();

  constructor(private readonly initialContext: OrchestrationContext) {}

  async validate(context: OrchestrationContext = this.initialContext): Promise<boolean> {
    return this.validator.validateRequirements(context.requirement);
  }

  async generate(
    context: OrchestrationContext = this.initialContext
  ): Promise<Record<string, string>> {
    logger.info('Starting frontend generation', { appId: context.appId });

    const isValid = await this.validate(context);
    if (!isValid) {
      logger.warn('Frontend generation received invalid requirements', {
        appId: context.appId,
        requirement: context.requirement,
      });

      return {
        'README.md': `# Frontend Generation Failed\n\nInvalid requirements provided.`,
      };
    }

    const requirement = context.requirement;

    const files: Record<string, string> = {
      ...this.structureGenerator.generateProjectStructure(requirement.name),
    };

    const endpoints = requirement.apiEndpoints ?? [];
    files['src/services/apiClient.ts'] = this.serviceGenerator.generateAPIService(endpoints);

    for (const endpoint of endpoints) {
      const fnName = endpointFunctionName(endpoint);
      const hookFileName = `use${toPascalCase(fnName)}.ts`;
      files[`src/hooks/${hookFileName}`] = this.hookGenerator.generateDataFetchHook(endpoint);
    }

    const componentDefs = requirement.uiComponents ?? [];
    const tables = requirement.databaseTables ?? [];

    const routes: GeneratedRoute[] = [];

    const dashboard = componentDefs.find((c) => c.type === 'dashboard');
    if (!dashboard) {
      const dashboardPageName = 'DashboardPage';
      files[`src/pages/${dashboardPageName}.tsx`] = this.pageGenerator.generateDashboard(
        (requirement.features ?? []).slice(0, 6),
        dashboardPageName
      );

      routes.push({
        path: '/dashboard',
        componentName: dashboardPageName,
        filePath: `src/pages/${dashboardPageName}.tsx`,
        navLabel: 'Dashboard',
        showInNav: true,
      });
    }

    for (const componentDef of componentDefs) {
      this.generateForComponentDefinition(componentDef, requirement, tables, files, routes);
    }

    if (!routes.some((r) => r.path === '/dashboard')) {
      const dashboardRoute = routes.find((r) => r.componentName.endsWith('DashboardPage'));
      if (dashboardRoute) {
        dashboardRoute.path = '/dashboard';
        dashboardRoute.navLabel = dashboardRoute.navLabel ?? 'Dashboard';
        dashboardRoute.showInNav = dashboardRoute.showInNav ?? true;
      }
    }

    files['src/routes.tsx'] = this.generateRoutesFile(routes);
    files['src/components/layout/Navigation.tsx'] = this.generateNavigationFile(
      requirement,
      routes
    );

    files['src/App.tsx'] = this.structureGenerator.generateProjectStructure(requirement.name)[
      'src/App.tsx'
    ];

    logger.info('Frontend generation completed', {
      appId: context.appId,
      files: Object.keys(files).length,
      routes: routes.length,
    });

    return files;
  }

  private generateForComponentDefinition(
    componentDef: UIComponentDefinition,
    requirement: AppRequirement,
    tables: TableDefinition[],
    files: Record<string, string>,
    routes: GeneratedRoute[]
  ): void {
    const inferredResource = this.inferResource(componentDef);
    const fields = this.inferFields(componentDef, inferredResource, requirement, tables);

    logger.info('Generating UI component', {
      name: componentDef.name,
      type: componentDef.type,
      resource: inferredResource,
    });

    if (componentDef.type === 'form') {
      files[`src/components/${componentDef.name}.tsx`] =
        this.componentGenerator.generateFormComponent(fields, componentDef.name);
      files[`src/components/${componentDef.name}.module.css`] =
        this.componentGenerator.generateComponentStyles(componentDef.name);

      const formHookName = `use${componentDef.name}Form`;
      files[`src/hooks/${formHookName}.ts`] = this.hookGenerator.generateFormHook(
        fields,
        formHookName
      );

      const pageName = this.pageComponentName(componentDef.name);
      files[`src/pages/${pageName}.tsx`] = this.generateFormPage(
        componentDef,
        inferredResource
      );

      routes.push({
        path: `/${toKebabCase(pluralize(singularize(inferredResource)))}/new`,
        componentName: pageName,
        filePath: `src/pages/${pageName}.tsx`,
        navLabel: `${toPascalCase(singularize(inferredResource))} New`,
        showInNav: false,
      });

      return;
    }

    if (componentDef.type === 'list') {
      const listFields = this.ensureIdField(fields);
      files[`src/components/${componentDef.name}.tsx`] =
        this.componentGenerator.generateListComponent(
          pluralize(singularize(inferredResource)),
          listFields,
          componentDef.name
        );

      const pageName = this.pageComponentName(componentDef.name);
      files[`src/pages/${pageName}.tsx`] = this.pageGenerator.generateListPage(
        inferredResource,
        componentDef.name,
        pageName
      );

      routes.push({
        path: `/${toKebabCase(pluralize(singularize(inferredResource)))}`,
        componentName: pageName,
        filePath: `src/pages/${pageName}.tsx`,
        navLabel: toPascalCase(pluralize(singularize(inferredResource))),
        showInNav: true,
      });

      return;
    }

    if (componentDef.type === 'detail') {
      const detailFields = this.ensureIdField(fields);
      files[`src/components/${componentDef.name}.tsx`] =
        this.componentGenerator.generateDetailComponent(
          pluralize(singularize(inferredResource)),
          detailFields,
          componentDef.name
        );

      const pageName = this.pageComponentName(componentDef.name);
      files[`src/pages/${pageName}.tsx`] = this.pageGenerator.generateDetailPage(
        inferredResource,
        componentDef.name,
        pageName
      );

      routes.push({
        path: `/${toKebabCase(pluralize(singularize(inferredResource)))}/:id`,
        componentName: pageName,
        filePath: `src/pages/${pageName}.tsx`,
        showInNav: false,
      });

      return;
    }

    if (componentDef.type === 'dashboard') {
      const pageName = this.pageComponentName(componentDef.name);
      files[`src/pages/${pageName}.tsx`] = this.pageGenerator.generateDashboard(
        (requirement.features ?? []).slice(0, 6),
        pageName
      );

      routes.push({
        path: '/dashboard',
        componentName: pageName,
        filePath: `src/pages/${pageName}.tsx`,
        navLabel: 'Dashboard',
        showInNav: true,
      });

      return;
    }

    if (componentDef.type === 'page') {
      const pageName = this.pageComponentName(componentDef.name);
      files[`src/pages/${pageName}.tsx`] = this.pageGenerator.generatePage(pageName, []);

      routes.push({
        path: `/${toKebabCase(componentDef.name)}`,
        componentName: pageName,
        filePath: `src/pages/${pageName}.tsx`,
        navLabel: toPascalCase(componentDef.name),
        showInNav: true,
      });
    }
  }

  private inferResource(componentDef: UIComponentDefinition): string {
    const endpoint = componentDef.relatedEndpoints?.[0];
    if (endpoint) {
      return inferResourceFromEndpoint(endpoint);
    }

    return toKebabCase(componentDef.name);
  }

  private inferFields(
    componentDef: UIComponentDefinition,
    resource: string,
    requirement: AppRequirement,
    tables: TableDefinition[]
  ): string[] {
    if (componentDef.fields && componentDef.fields.length > 0) {
      return componentDef.fields.map((f) => sanitizeIdentifier(f));
    }

    const tableMatch = this.findTableForResource(resource, tables);
    if (tableMatch) {
      const columns = tableMatch.columns.map((c) => c.name);
      if (componentDef.type === 'form') {
        return columns.filter((c) => c !== 'id').slice(0, 8).map((c) => sanitizeIdentifier(c));
      }

      return columns.slice(0, 8).map((c) => sanitizeIdentifier(c));
    }

    if (componentDef.type === 'form') return ['name'];
    if (componentDef.type === 'detail') return ['id', 'name', 'created_at'];
    if (componentDef.type === 'list') return ['id', 'name'];

    const fallback = requirement.features.slice(0, 3).map((f) => sanitizeIdentifier(f));
    return fallback.length > 0 ? fallback : ['id'];
  }

  private ensureIdField(fields: string[]): string[] {
    const unique = Array.from(new Set(fields));
    if (!unique.includes('id')) {
      unique.unshift('id');
    }
    return unique;
  }

  private findTableForResource(
    resource: string,
    tables: TableDefinition[]
  ): TableDefinition | undefined {
    const normalized = pluralize(singularize(resource)).toLowerCase();
    const singular = singularize(normalized);

    return tables.find((t) => {
      const name = t.name.toLowerCase();
      return name === normalized || name === singular || pluralize(name) === normalized;
    });
  }

  private pageComponentName(baseName: string): string {
    const name = baseName.endsWith('Page') ? baseName : `${baseName}Page`;
    return toPascalCase(name);
  }

  private generateFormPage(componentDef: UIComponentDefinition, resource: string): string {
    const pageName = this.pageComponentName(componentDef.name);
    const componentName = toPascalCase(componentDef.name);
    const endpointResource = pluralize(singularize(resource));
    const listRoute = `/${toKebabCase(endpointResource)}`;

    return `import React, { useState } from 'react';\nimport { useNavigate } from 'react-router-dom';\n\nimport { ${componentName} } from '../components/${componentName}';\nimport { apiClient } from '../services/apiClient';\n\n/**\n * ${pageName}\n *\n * Create form page for ${endpointResource}.\n */\nexport const ${pageName}: React.FC = () => {\n  const navigate = useNavigate();\n  const [error, setError] = useState<string | null>(null);\n\n  return (\n    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>\n      <h1 style={{ margin: 0 }}>New ${toPascalCase(singularize(endpointResource))}</h1>\n      {error ? <div role=\"alert\">{error}</div> : null}\n      <${componentName}\n        onCancel={() => navigate('${listRoute}')}\n        onSubmit={async (values) => {\n          try {\n            setError(null);\n            await apiClient.post('/api/${endpointResource}', values);\n            navigate('${listRoute}');\n          } catch (err) {\n            setError(err instanceof Error ? err.message : 'Unknown error');\n          }\n        }}\n      />\n    </div>\n  );\n};\n`;
  }

  private generateRoutesFile(routes: GeneratedRoute[]): string {
    const uniqueRoutes = this.uniqueRoutes(routes);

    const imports = uniqueRoutes
      .map((route) => `import { ${route.componentName} } from './pages/${route.componentName}';`)
      .join('\n');

    const routeElements = uniqueRoutes
      .map((route) => `      <Route path=\"${route.path}\" element={<${route.componentName} />} />`)
      .join('\n');

    return `import React from 'react';\nimport { Navigate, Route, Routes } from 'react-router-dom';\n\n${imports}\n\nexport const AppRoutes: React.FC = () => {\n  return (\n    <Routes>\n      <Route path=\"/\" element={<Navigate to=\"/dashboard\" replace />} />\n${routeElements}\n      <Route path=\"*\" element={<div>Not Found</div>} />\n    </Routes>\n  );\n};\n`;
  }

  private generateNavigationFile(requirement: AppRequirement, routes: GeneratedRoute[]): string {
    const navRoutes = this.uniqueRoutes(routes).filter((r) => r.showInNav);

    const links = navRoutes
      .map((route) => {
        const label = route.navLabel ?? route.componentName;
        return `        <Link to=\"${route.path}\" style={linkStyle}>${label}</Link>`;
      })
      .join('\n');

    return `import React from 'react';\nimport { Link } from 'react-router-dom';\n\nexport const Navigation: React.FC = () => {\n  return (\n    <header style={headerStyle}>\n      <div style={containerStyle}>\n        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>\n          <strong>${requirement.name}</strong>\n          <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>\n${links || '            {/* Add navigation links */}'}\n          </nav>\n        </div>\n      </div>\n    </header>\n  );\n};\n\nconst headerStyle: React.CSSProperties = {\n  background: '#ffffff',\n  borderBottom: '1px solid #e4e7ec',\n  padding: '14px 24px',\n};\n\nconst containerStyle: React.CSSProperties = {\n  maxWidth: 1200,\n  margin: '0 auto',\n  display: 'flex',\n  justifyContent: 'space-between',\n};\n\nconst linkStyle: React.CSSProperties = {\n  color: '#344054',\n  textDecoration: 'none',\n  fontWeight: 600,\n  fontSize: 14,\n};\n`;
  }

  private uniqueRoutes(routes: GeneratedRoute[]): GeneratedRoute[] {
    const byPath = new Map<string, GeneratedRoute>();
    for (const route of routes) {
      if (!route.path || !route.componentName) continue;
      byPath.set(route.path, route);
    }

    return Array.from(byPath.values());
  }
}

export * from './component-generator';
export * from './hook-generator';
export * from './page-generator';
export * from './service-generator';
export * from './structure-generator';
export * from './validator';
export * from './utils';
