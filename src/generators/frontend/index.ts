import {
  CodeGenerator,
  GeneratorContext,
  GeneratorResult,
  GeneratedFile,
} from '../../types/generator';
import { logger } from '../../utils/logger';

export class FrontendGenerator implements CodeGenerator {
  async generate(context: GeneratorContext): Promise<GeneratorResult> {
    logger.info('Starting frontend code generation');
    const files: GeneratedFile[] = [];
    await Promise.resolve();

    try {
      const isValid = this.validate(context);
      if (!isValid) {
        return {
          success: false,
          files: [],
          errors: [
            {
              message: 'Invalid generator context for frontend generation',
              severity: 'error',
            },
          ],
        };
      }

      logger.info('Frontend generation completed successfully');
      return {
        success: true,
        files,
      };
    } catch (error) {
      logger.error('Frontend generation failed:', error);
      return {
        success: false,
        files: [],
        errors: [
          {
            message: error instanceof Error ? error.message : 'Unknown error',
            severity: 'error',
          },
        ],
      };
    }
  }

  validate(context: GeneratorContext): boolean {
    if (!context.appDefinition) {
      logger.error('No app definition provided');
      return false;
    }

    if (!context.appDefinition.stack.frontend) {
      logger.error('No frontend stack configuration found');
      return false;
    }

    return true;
  }
}
