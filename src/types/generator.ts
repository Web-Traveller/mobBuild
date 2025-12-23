import { AppDefinition } from './app';

export interface GeneratorContext {
  appDefinition: AppDefinition;
  outputPath: string;
  options?: GeneratorOptions;
}

export interface GeneratorOptions {
  overwrite?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: FileType;
}

export enum FileType {
  SOURCE = 'source',
  CONFIG = 'config',
  SCHEMA = 'schema',
  TEST = 'test',
  DOCUMENTATION = 'documentation',
}

export interface GeneratorResult {
  success: boolean;
  files: GeneratedFile[];
  errors?: GeneratorError[];
  warnings?: string[];
}

export interface GeneratorError {
  message: string;
  file?: string;
  line?: number;
  severity: 'error' | 'warning';
}

export interface CodeGenerator {
  generate(context: GeneratorContext): Promise<GeneratorResult>;
  validate(context: GeneratorContext): boolean;
}
