import * as dotenv from 'dotenv';
import { logger } from './utils/logger';
import { Orchestrator } from './orchestrator';
import { MCPOrchestratorImpl } from './mcp/orchestrator';
import { BackendMCPServer, FrontendMCPServer, DatabaseMCPServer, GitHubMCPServer } from './mcp';
import { AppRequirement } from './types/app';

dotenv.config();

// Export main orchestrator and MCP orchestrator for external use
export { Orchestrator } from './orchestrator';
export { MCPOrchestratorImpl } from './mcp/orchestrator';
export * from './types';

/**
 * Initialize the MCP orchestrator with all servers
 */
async function initializeMCPOrchestrator(): Promise<MCPOrchestratorImpl> {
  logger.info('Initializing MCP Orchestrator');

  const mcpOrchestrator = new MCPOrchestratorImpl();

  // Create and register all MCP servers
  const backendServer = new BackendMCPServer();
  const frontendServer = new FrontendMCPServer();
  const databaseServer = new DatabaseMCPServer();
  const githubServer = new GitHubMCPServer();

  await mcpOrchestrator.registerServer(backendServer);
  await mcpOrchestrator.registerServer(frontendServer);
  await mcpOrchestrator.registerServer(databaseServer);
  await mcpOrchestrator.registerServer(githubServer);

  // Health check
  const healthStatus = await mcpOrchestrator.healthCheck();
  logger.info('MCP Server Health Status:', healthStatus);

  return mcpOrchestrator;
}

/**
 * Initialize the AI orchestration engine
 */
async function initializeOrchestrator(): Promise<Orchestrator> {
  logger.info('Initializing AI Orchestration Engine');

  const mcpOrchestrator = await initializeMCPOrchestrator();
  const orchestrator = new Orchestrator(mcpOrchestrator);

  logger.info('AI Orchestration Engine initialized successfully');
  return orchestrator;
}

/**
 * Demo function showing orchestrator usage
 */
async function runDemo(orchestrator: Orchestrator): Promise<void> {
  logger.info('========================================');
  logger.info('Running Orchestrator Demo');
  logger.info('========================================');

  try {
    // Example 1: Parse requirement from natural language
    const userInput = `
Name: TaskMaster
Description: A task management application with user authentication
Features:
- User registration and login
- Create and manage tasks
- Task categories and priorities
- Due date reminders
    `;

    const parsedRequirement = await orchestrator.parseRequirement(userInput);
    logger.info('Parsed Requirement:', parsedRequirement);

    // Example 2: Create a complete app from structured requirement
    const requirement: AppRequirement = {
      name: 'MyBlogApp',
      description: 'A simple blog application with posts and comments',
      features: [
        'User authentication',
        'Create and edit blog posts',
        'Comment on posts',
        'Like/unlike posts',
      ],
      databaseTables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'number', required: true, unique: true },
            { name: 'email', type: 'string', required: true, unique: true },
            { name: 'password', type: 'string', required: true },
            { name: 'name', type: 'string', required: true },
          ],
        },
        {
          name: 'posts',
          columns: [
            { name: 'id', type: 'number', required: true, unique: true },
            { name: 'title', type: 'string', required: true },
            { name: 'content', type: 'text', required: true },
            { name: 'author_id', type: 'number', required: true },
            { name: 'created_at', type: 'date', required: true },
          ],
        },
      ],
      apiEndpoints: [
        {
          path: '/api/posts',
          method: 'GET',
          description: 'Get all posts',
        },
        {
          path: '/api/posts',
          method: 'POST',
          description: 'Create a new post',
        },
        {
          path: '/api/posts/:id',
          method: 'GET',
          description: 'Get post by ID',
        },
      ],
      uiComponents: [
        {
          name: 'PostList',
          type: 'list',
          relatedEndpoints: ['/api/posts'],
          fields: ['title', 'author', 'created_at'],
        },
        {
          name: 'PostDetail',
          type: 'detail',
          relatedEndpoints: ['/api/posts/:id'],
          fields: ['title', 'content', 'author', 'created_at'],
        },
        {
          name: 'PostForm',
          type: 'form',
          relatedEndpoints: ['/api/posts'],
          fields: ['title', 'content'],
        },
      ],
    };

    logger.info('========================================');
    logger.info('Starting App Generation');
    logger.info('========================================');

    const generatedApp = await orchestrator.generateApp(requirement);

    logger.info('App Generated Successfully!');
    logger.info(`App ID: ${generatedApp.id}`);
    logger.info(`App Name: ${generatedApp.name}`);
    logger.info(`Status: ${generatedApp.status}`);
    logger.info(`Frontend Files: ${Object.keys(generatedApp.frontend.code).length}`);
    logger.info(`Backend Files: ${Object.keys(generatedApp.backend.code).length}`);
    logger.info(`Database Schema Files: ${Object.keys(generatedApp.database.schema).length}`);
    logger.info(
      `Database Migration Files: ${Object.keys(generatedApp.database.migrations).length}`
    );

    // List all active apps
    const allApps = orchestrator.listApps();
    logger.info(`Total Active Apps: ${allApps.length}`);

    // Get app status
    const appStatus = orchestrator.getAppStatus(generatedApp.id);
    if (appStatus) {
      logger.info(`App Status for ${generatedApp.id}:`);
      logger.info(`  - Current Phase: ${appStatus.currentPhase}`);
      logger.info(`  - Errors: ${appStatus.errors.length}`);
    }

    logger.info('========================================');
    logger.info('Demo Completed Successfully!');
    logger.info('========================================');
  } catch (error) {
    logger.error('Demo failed:', error);
    throw error;
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  logger.info('Starting mobBuild - AI-powered web app builder');
  logger.info(`Node version: ${process.version}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    // Initialize orchestrator
    const orchestrator = await initializeOrchestrator();

    // Run demo if in development mode
    if (process.env.NODE_ENV !== 'production') {
      await runDemo(orchestrator);
    }

    logger.info('mobBuild ready for development...');
  } catch (error) {
    logger.error('Fatal error during initialization:', error);
    throw error;
  }
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}
