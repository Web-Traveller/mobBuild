import { AppDefinition } from '../types/app';
import { GeneratorContext, GeneratorResult } from '../types/generator';
import { FrontendGenerator } from '../generators/frontend';
import { BackendGenerator } from '../generators/backend';
import { DatabaseGenerator } from '../generators/database';
import { MCPOrchestratorImpl } from '../mcp/orchestrator';
import { logger } from '../utils/logger';

export class OrchestrationEngine {
  private frontendGenerator: FrontendGenerator;
  private backendGenerator: BackendGenerator;
  private databaseGenerator: DatabaseGenerator;
  private mcpOrchestrator: MCPOrchestratorImpl;

  constructor() {
    this.frontendGenerator = new FrontendGenerator();
    this.backendGenerator = new BackendGenerator();
    this.databaseGenerator = new DatabaseGenerator();
    this.mcpOrchestrator = new MCPOrchestratorImpl();
  }

  async generateApplication(
    appDefinition: AppDefinition,
    outputPath: string
  ): Promise<GeneratorResult[]> {
    logger.info(`Starting application generation: ${appDefinition.name}`);

    const context: GeneratorContext = {
      appDefinition,
      outputPath,
      options: {
        overwrite: false,
        dryRun: false,
        verbose: true,
      },
    };

    const results: GeneratorResult[] = [];

    try {
      const frontendResult = await this.frontendGenerator.generate(context);
      results.push(frontendResult);

      const backendResult = await this.backendGenerator.generate(context);
      results.push(backendResult);

      const databaseResult = await this.databaseGenerator.generate(context);
      results.push(databaseResult);

      logger.info('Application generation completed');
      return results;
    } catch (error) {
      logger.error('Application generation failed:', error);
      throw error;
    }
  }

  getMCPOrchestrator(): MCPOrchestratorImpl {
    return this.mcpOrchestrator;
  }
}
