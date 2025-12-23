export interface AppDefinition {
  name: string;
  description: string;
  features: Feature[];
  stack: TechStack;
  configuration: AppConfiguration;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  type: FeatureType;
  dependencies?: string[];
}

export enum FeatureType {
  AUTHENTICATION = 'authentication',
  DATABASE = 'database',
  API = 'api',
  UI_COMPONENT = 'ui_component',
  FILE_UPLOAD = 'file_upload',
  PAYMENT = 'payment',
  NOTIFICATIONS = 'notifications',
}

export interface TechStack {
  frontend: FrontendStack;
  backend: BackendStack;
  database: DatabaseStack;
}

export interface FrontendStack {
  framework: 'react' | 'vue' | 'angular' | 'svelte';
  language: 'typescript' | 'javascript';
  styling: 'css' | 'scss' | 'tailwind' | 'styled-components';
  buildTool: 'vite' | 'webpack' | 'parcel';
}

export interface BackendStack {
  framework: 'express' | 'fastify' | 'nestjs' | 'koa';
  language: 'typescript' | 'javascript';
  runtime: 'node';
}

export interface DatabaseStack {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite';
  orm?: 'prisma' | 'typeorm' | 'sequelize' | 'mongoose';
}

export interface AppConfiguration {
  port?: number;
  environment?: 'development' | 'production' | 'staging';
  features?: Record<string, unknown>;
}
