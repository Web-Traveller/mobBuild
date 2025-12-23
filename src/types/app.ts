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

// ===========================
// New Orchestration Types
// ===========================

// Column definition for database tables
export interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'text' | 'json';
  required: boolean;
  unique?: boolean;
}

// Table definition for database
export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
}

// API endpoint definition
export interface APIEndpointDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
}

// UI component definition
export interface UIComponentDefinition {
  name: string;
  type: 'page' | 'form' | 'list' | 'detail' | 'dashboard';
  relatedEndpoints: string[];
  fields?: string[];
}

// User's app request/requirements
export interface AppRequirement {
  name: string;
  description: string;
  features: string[];
  databaseTables?: TableDefinition[];
  apiEndpoints?: APIEndpointDefinition[];
  uiComponents?: UIComponentDefinition[];
}

// Generated app output
export interface GeneratedApp {
  id: string;
  name: string;
  requirement: AppRequirement;
  frontend: {
    language: 'typescript';
    framework: 'react';
    code: Record<string, string>; // file paths to code
  };
  backend: {
    language: 'typescript';
    framework: 'express';
    code: Record<string, string>;
  };
  database: {
    type: 'postgresql';
    schema: Record<string, string>;
    migrations: Record<string, string>;
  };
  github: {
    repositoryUrl?: string;
    defaultBranch: string;
  };
  createdAt: Date;
  status: 'planning' | 'generating' | 'generated' | 'deploying' | 'deployed' | 'failed';
}

// Orchestration context
export interface OrchestrationContext {
  appId: string;
  requirement: AppRequirement;
  generatedApp?: GeneratedApp;
  currentPhase: 'planning' | 'generating' | 'deploying';
  errors: string[];
}
