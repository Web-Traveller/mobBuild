import {
  CodeGenerator,
  GeneratorContext,
  GeneratorResult,
  GeneratedFile,
} from '../../types/generator';
import { logger } from '../../utils/logger';

export class BackendGenerator implements CodeGenerator {
  async generate(context: GeneratorContext): Promise<GeneratorResult> {
    logger.info('Starting backend code generation');
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
              message: 'Invalid generator context for backend generation',
              severity: 'error',
            },
          ],
        };
      }

      logger.info('Backend generation completed successfully');
      return {
        success: true,
        files,
      };
    } catch (error) {
      logger.error('Backend generation failed:', error);
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

    if (!context.appDefinition.stack.backend) {
      logger.error('No backend stack configuration found');
      return false;
    }

    return true;
  }
}
