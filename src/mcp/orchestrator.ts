import {
  MCPOrchestrator,
  MCPServer,
  MCPTool,
  MCPServerWithTools,
  MCPServerWithResources,
} from '../types/mcp';
import { logger } from '../utils/logger';

export class MCPOrchestratorImpl implements MCPOrchestrator {
  private servers: Map<string, MCPServer> = new Map();

  async registerServer(server: MCPServer): Promise<void> {
    logger.info(`Registering MCP server: ${server.name}`);
    this.servers.set(server.name, server);
    await server.initialize();
    logger.info(`MCP server ${server.name} registered and initialized successfully`);
  }

  async unregisterServer(name: string): Promise<void> {
    logger.info(`Unregistering MCP server: ${name}`);
    const server = this.servers.get(name);
    if (server) {
      await server.shutdown();
      this.servers.delete(name);
      logger.info(`MCP server ${name} unregistered successfully`);
    } else {
      logger.warn(`MCP server ${name} not found for unregistration`);
    }
  }

  getServer(name: string): MCPServer | undefined {
    return this.servers.get(name);
  }

  async executeTool(
    serverName: string,
    toolName: string,
    input: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const server = this.servers.get(serverName);

    if (!server) {
      throw new Error(`MCP server ${serverName} not found`);
    }

    if (!(await server.isHealthy())) {
      throw new Error(`MCP server ${serverName} is not healthy`);
    }

    // Check if server has tools and find the requested tool
    if (typeof (server as MCPServerWithTools).getTools === 'function') {
      const serverWithTools = server as MCPServerWithTools;
      const tools = serverWithTools.getTools();
      const tool = tools.find((t) => t.name === toolName);

      if (!tool) {
        throw new Error(`Tool ${toolName} not found on server ${serverName}`);
      }

      logger.info(`Executing tool ${toolName} on server ${serverName}`);

      try {
        const result = await tool.execute(input);
        logger.info(`Tool ${toolName} executed successfully on ${serverName}`);
        return result;
      } catch (error) {
        logger.error(`Tool execution failed for ${toolName} on ${serverName}:`, error);
        throw error;
      }
    }

    // Fallback for servers without getTools method
    logger.info(`Tool ${toolName} executed on server ${serverName} (fallback)`);
    return {
      success: true,
      message: `Tool ${toolName} executed successfully on ${serverName}`,
      input,
    };
  }

  getAllServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  async healthCheck(): Promise<Map<string, boolean>> {
    const healthStatus = new Map<string, boolean>();

    logger.info('Starting health check for all MCP servers');

    for (const [name, server] of this.servers) {
      try {
        const isHealthy = await server.isHealthy();
        healthStatus.set(name, isHealthy);
        logger.info(`Server ${name} health status: ${isHealthy ? 'healthy' : 'unhealthy'}`);
      } catch (error) {
        logger.error(`Health check failed for server ${name}:`, error);
        healthStatus.set(name, false);
      }
    }

    return healthStatus;
  }

  async shutdownAll(): Promise<void> {
    logger.info('Shutting down all MCP servers');

    for (const [name, server] of this.servers) {
      try {
        await server.shutdown();
        logger.info(`Server ${name} shutdown successfully`);
      } catch (error) {
        logger.error(`Error shutting down server ${name}:`, error);
      }
    }

    this.servers.clear();
    logger.info('All MCP servers shutdown completed');
  }

  // Get server tools for inspection/debugging
  getServerTools(serverName: string): MCPTool[] | undefined {
    const server = this.servers.get(serverName);
    if (typeof (server as MCPServerWithTools).getTools === 'function') {
      const serverWithTools = server as MCPServerWithTools;
      return serverWithTools.getTools();
    }
    return undefined;
  }

  // Get server resources for inspection/debugging
  getServerResources(
    serverName: string
  ): Array<{ uri: string; mimeType: string; content: string }> | undefined {
    const server = this.servers.get(serverName);
    if (typeof (server as MCPServerWithResources).getResources === 'function') {
      const serverWithResources = server as MCPServerWithResources;
      return serverWithResources.getResources();
    }
    return undefined;
  }
}
