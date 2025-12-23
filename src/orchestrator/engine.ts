import {
  AppRequirement,
  GeneratedApp,
  OrchestrationContext,
  TableDefinition,
  APIEndpointDefinition,
  UIComponentDefinition,
} from '../types/app';
import { OrchestrationCodeGenerator } from '../types/generator';
import { MCPOrchestrator } from '../types/mcp';
import { logger } from '../utils/logger';

export class Orchestrator {
  private mcpOrchestrator: MCPOrchestrator;
  private activeApps: Map<string, OrchestrationContext> = new Map();
  private generators: Map<string, OrchestrationCodeGenerator> = new Map();

  constructor(mcpOrchestrator: MCPOrchestrator) {
    this.mcpOrchestrator = mcpOrchestrator;
    logger.info('Orchestrator initialized');
  }

  /**
   * Parse user requirements into structured format
   * In a real implementation, this would use an LLM to parse natural language
   */
  async parseRequirement(userInput: string): Promise<AppRequirement> {
    logger.info('Parsing user requirement from input');

    // Simple parsing logic - in production, this would use an LLM
    const lines = userInput.split('\n').filter((line) => line.trim());
    const name = this.extractAppName(lines);
    const description = this.extractDescription(lines);
    const features = this.extractFeatures(lines);

    // Simulate async processing
    await Promise.resolve();

    const requirement: AppRequirement = {
      name,
      description,
      features,
      databaseTables: this.extractDatabaseTables(lines),
      apiEndpoints: this.extractAPIEndpoints(lines),
      uiComponents: this.extractUIComponents(lines),
    };

    logger.info(`Parsed requirement for app: ${name}`);
    return requirement;
  }

  /**
   * Plan the app generation workflow
   */
  async planGeneration(requirement: AppRequirement): Promise<OrchestrationContext> {
    logger.info(`Planning generation for app: ${requirement.name}`);

    const appId = this.generateAppId();
    const context: OrchestrationContext = {
      appId,
      requirement,
      currentPhase: 'planning',
      errors: [],
    };

    this.activeApps.set(appId, context);

    // Validate requirement
    if (!requirement.name || requirement.name.trim() === '') {
      context.errors.push('App name is required');
    }

    if (!requirement.description || requirement.description.trim() === '') {
      context.errors.push('App description is required');
    }

    if (!requirement.features || requirement.features.length === 0) {
      context.errors.push('At least one feature is required');
    }

    // Simulate async processing
    await Promise.resolve();

    logger.info(`Planning completed for app ${appId}. Errors: ${context.errors.length}`);
    return context;
  }

  /**
   * Generate complete app (frontend + backend + database)
   */
  async generateApp(requirement: AppRequirement): Promise<GeneratedApp> {
    logger.info(`Starting app generation for: ${requirement.name}`);

    const appId = this.generateAppId();
    const context = await this.planGeneration(requirement);

    if (context.errors.length > 0) {
      throw new Error(`Planning failed: ${context.errors.join(', ')}`);
    }

    // Update phase to generating
    context.currentPhase = 'generating';
    this.activeApps.set(appId, context);

    try {
      // Generate database schema and migrations
      const databaseCode = await this.generateDatabase(requirement);

      // Generate backend API
      const backendCode = await this.generateBackend(requirement);

      // Generate frontend components and pages
      const frontendCode = await this.generateFrontend(requirement);

      // Create GeneratedApp object
      const generatedApp: GeneratedApp = {
        id: appId,
        name: requirement.name,
        requirement,
        frontend: {
          language: 'typescript',
          framework: 'react',
          code: frontendCode,
        },
        backend: {
          language: 'typescript',
          framework: 'express',
          code: backendCode,
        },
        database: {
          type: 'postgresql',
          schema: databaseCode.schema,
          migrations: databaseCode.migrations,
        },
        github: {
          defaultBranch: 'main',
        },
        createdAt: new Date(),
        status: 'generated',
      };

      context.generatedApp = generatedApp;
      this.activeApps.set(appId, context);

      logger.info(`App generation completed for: ${requirement.name}`);
      return generatedApp;
    } catch (error) {
      context.errors.push(
        `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      this.activeApps.set(appId, context);
      logger.error('App generation failed:', error);
      throw error;
    }
  }

  /**
   * Orchestrate the full workflow: plan -> generate -> deploy
   */
  async orchestrateAppCreation(requirement: AppRequirement): Promise<GeneratedApp> {
    logger.info(`Starting full orchestration for: ${requirement.name}`);

    try {
      // Plan the generation
      const context = await this.planGeneration(requirement);

      if (context.errors.length > 0) {
        throw new Error(`Planning failed: ${context.errors.join(', ')}`);
      }

      // Generate the app
      const generatedApp = await this.generateApp(requirement);

      // Deploy the app
      const deploymentUrl = await this.deployApp(generatedApp);

      // Update app status
      generatedApp.status = 'deployed';
      generatedApp.github.repositoryUrl = deploymentUrl;

      const context2 = this.activeApps.get(generatedApp.id);
      if (context2) {
        context2.generatedApp = generatedApp;
        context2.currentPhase = 'deploying';
        this.activeApps.set(generatedApp.id, context2);
      }

      logger.info(`Full orchestration completed for: ${requirement.name}`);
      return generatedApp;
    } catch (error) {
      logger.error('Orchestration failed:', error);
      throw error;
    }
  }

  /**
   * Deploy generated app (create GitHub repo, push code, deploy)
   */
  async deployApp(generatedApp: GeneratedApp): Promise<string> {
    logger.info(`Deploying app: ${generatedApp.name}`);

    try {
      // Create GitHub repository
      const repoResult = await this.mcpOrchestrator.executeTool(
        'github-service',
        'create-repository',
        {
          name: generatedApp.name,
          description: generatedApp.requirement.description,
          private: false,
        }
      );

      logger.info(`GitHub repository created: ${JSON.stringify(repoResult)}`);

      // Prepare files for commit
      const files: Array<{ path: string; content: string }> = [];

      // Add frontend files
      for (const [path, content] of Object.entries(generatedApp.frontend.code)) {
        files.push({ path: `frontend/${path}`, content });
      }

      // Add backend files
      for (const [path, content] of Object.entries(generatedApp.backend.code)) {
        files.push({ path: `backend/${path}`, content });
      }

      // Add database files
      for (const [path, content] of Object.entries(generatedApp.database.schema)) {
        files.push({ path: `database/schema/${path}`, content });
      }

      for (const [path, content] of Object.entries(generatedApp.database.migrations)) {
        files.push({ path: `database/migrations/${path}`, content });
      }

      // Commit code to repository
      await this.mcpOrchestrator.executeTool('github-service', 'commit-code', {
        repository: generatedApp.name,
        files,
        message: 'Initial commit: Generated app code',
      });

      logger.info('Code committed to GitHub');

      // Setup CI/CD workflows
      await this.mcpOrchestrator.executeTool('github-service', 'setup-workflows', {
        repository: generatedApp.name,
        workflow: 'ci-cd',
      });

      logger.info('CI/CD workflows configured');

      const repositoryUrl = `https://github.com/user/${generatedApp.name}`;
      logger.info(`App deployed successfully: ${repositoryUrl}`);

      return repositoryUrl;
    } catch (error) {
      logger.error('Deployment failed:', error);
      throw error;
    }
  }

  /**
   * Get app by ID
   */
  getAppStatus(appId: string): OrchestrationContext | undefined {
    return this.activeApps.get(appId);
  }

  /**
   * List all generated apps
   */
  listApps(): OrchestrationContext[] {
    return Array.from(this.activeApps.values());
  }

  /**
   * Cancel/cleanup app
   */
  async cancelApp(appId: string): Promise<void> {
    logger.info(`Cancelling app: ${appId}`);

    const context = this.activeApps.get(appId);
    if (context) {
      this.activeApps.delete(appId);
      logger.info(`App ${appId} cancelled and removed`);
    } else {
      logger.warn(`App ${appId} not found for cancellation`);
    }

    // Simulate async cleanup
    await Promise.resolve();
  }

  /**
   * Register a custom code generator
   */
  registerGenerator(generator: OrchestrationCodeGenerator): void {
    this.generators.set(generator.name, generator);
    logger.info(`Generator registered: ${generator.name}`);
  }

  // ===========================
  // Private Helper Methods
  // ===========================

  private generateAppId(): string {
    return `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractAppName(lines: string[]): string {
    const nameLine = lines.find((line) => line.toLowerCase().includes('name:'));
    if (nameLine) {
      return nameLine.split(':')[1].trim();
    }
    return 'MyApp';
  }

  private extractDescription(lines: string[]): string {
    const descLine = lines.find((line) => line.toLowerCase().includes('description:'));
    if (descLine) {
      return descLine.split(':')[1].trim();
    }
    return 'A generated application';
  }

  private extractFeatures(lines: string[]): string[] {
    const features: string[] = [];
    let inFeaturesSection = false;

    for (const line of lines) {
      if (line.toLowerCase().includes('features:')) {
        inFeaturesSection = true;
        continue;
      }
      if (inFeaturesSection && line.trim().startsWith('-')) {
        features.push(line.trim().substring(1).trim());
      }
    }

    return features.length > 0 ? features : ['User management', 'Data CRUD'];
  }

  private extractDatabaseTables(_lines: string[]): TableDefinition[] | undefined {
    // Simple extraction - in production, use LLM
    return undefined;
  }

  private extractAPIEndpoints(_lines: string[]): APIEndpointDefinition[] | undefined {
    // Simple extraction - in production, use LLM
    return undefined;
  }

  private extractUIComponents(_lines: string[]): UIComponentDefinition[] | undefined {
    // Simple extraction - in production, use LLM
    return undefined;
  }

  private async generateDatabase(
    requirement: AppRequirement
  ): Promise<{ schema: Record<string, string>; migrations: Record<string, string> }> {
    logger.info('Generating database schema and migrations');

    try {
      // Generate schema using database MCP server
      const schemaResult = await this.mcpOrchestrator.executeTool(
        'database-service',
        'generate-schema',
        {
          tables: requirement.databaseTables || [
            {
              name: 'users',
              columns: [
                { name: 'id', type: 'integer', primaryKey: true, autoIncrement: true },
                { name: 'email', type: 'varchar', nullable: false },
                { name: 'name', type: 'varchar', nullable: false },
                { name: 'created_at', type: 'timestamp', nullable: false },
              ],
            },
          ],
        }
      );

      // Setup migrations
      const migrationResult = await this.mcpOrchestrator.executeTool(
        'database-service',
        'setup-migrations',
        {
          version: '001',
          operation: 'create_tables',
        }
      );

      return {
        schema: {
          'schema.sql': (schemaResult.schema as string) || 'CREATE TABLE users (...)',
        },
        migrations: {
          '001_initial.sql': (migrationResult.migration as string) || 'CREATE TABLE users (...)',
        },
      };
    } catch (error) {
      logger.error('Database generation failed:', error);
      throw error;
    }
  }

  private async generateBackend(requirement: AppRequirement): Promise<Record<string, string>> {
    logger.info('Generating backend code');

    try {
      const endpoints = requirement.apiEndpoints || [
        { path: '/api/users', method: 'GET', description: 'Get all users' },
        { path: '/api/users/:id', method: 'GET', description: 'Get user by ID' },
      ];

      const backendCode: Record<string, string> = {};

      // Generate API for each endpoint
      for (const endpoint of endpoints) {
        const result = await this.mcpOrchestrator.executeTool('backend-service', 'generate-api', {
          endpoint: endpoint.path,
          method: endpoint.method,
          handlers: [`handle${endpoint.method}`],
        });

        backendCode[`${endpoint.path.replace(/\//g, '_')}.ts`] =
          (result.code as string) || `// ${endpoint.description}`;
      }

      // Deploy backend
      await this.mcpOrchestrator.executeTool('backend-service', 'deploy-backend', {
        environment: 'production',
        config: { port: 3000 },
      });

      backendCode['index.ts'] = 'import express from "express";\n// Main entry point';
      backendCode['package.json'] = JSON.stringify(
        {
          name: requirement.name,
          version: '1.0.0',
          dependencies: { express: '^4.18.0' },
        },
        null,
        2
      );

      return backendCode;
    } catch (error) {
      logger.error('Backend generation failed:', error);
      throw error;
    }
  }

  private async generateFrontend(requirement: AppRequirement): Promise<Record<string, string>> {
    logger.info('Generating frontend code');

    try {
      const components = requirement.uiComponents || [
        { name: 'UserList', type: 'list' as const, relatedEndpoints: ['/api/users'] },
        { name: 'UserDetail', type: 'detail' as const, relatedEndpoints: ['/api/users/:id'] },
      ];

      const frontendCode: Record<string, string> = {};

      // Generate components
      for (const component of components) {
        const result = await this.mcpOrchestrator.executeTool(
          'frontend-service',
          'generate-component',
          {
            name: component.name,
            props: { type: component.type },
          }
        );

        frontendCode[`components/${component.name}.tsx`] =
          (result.code as string) || `// ${component.name} component`;
      }

      // Generate main page
      await this.mcpOrchestrator.executeTool('frontend-service', 'create-page', {
        path: '/',
        components: components.map((c) => c.name),
      });

      // Deploy frontend
      await this.mcpOrchestrator.executeTool('frontend-service', 'deploy-frontend', {
        environment: 'production',
      });

      frontendCode['App.tsx'] = 'import React from "react";\n// Main App component';
      frontendCode['index.tsx'] = 'import React from "react";\nimport ReactDOM from "react-dom";';
      frontendCode['package.json'] = JSON.stringify(
        {
          name: `${requirement.name}-frontend`,
          version: '1.0.0',
          dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
        },
        null,
        2
      );

      return frontendCode;
    } catch (error) {
      logger.error('Frontend generation failed:', error);
      throw error;
    }
  }
}
