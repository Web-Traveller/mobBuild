import { MCPOrchestrator, MCPServer, MCPServerStatus, MCPRequest, MCPResponse } from '../types/mcp';
import { logger } from '../utils/logger';

export class MCPOrchestratorImpl implements MCPOrchestrator {
  private servers: Map<string, MCPServer> = new Map();

  registerServer(server: MCPServer): void {
    logger.info(`Registering MCP server: ${server.name} (${server.id})`);
    this.servers.set(server.id, server);
  }

  unregisterServer(serverId: string): void {
    logger.info(`Unregistering MCP server: ${serverId}`);
    this.servers.delete(serverId);
  }

  sendRequest<T>(request: MCPRequest): MCPResponse<T> {
    const server = this.servers.get(request.serverId);

    if (!server) {
      return {
        success: false,
        error: {
          code: 'SERVER_NOT_FOUND',
          message: `MCP server ${request.serverId} not found`,
        },
      };
    }

    logger.info(`Sending request to ${server.name}: ${request.capability}`);

    return {
      success: true,
      data: {} as T,
      metadata: {
        serverId: request.serverId,
        timestamp: new Date(),
        duration: 0,
      },
    };
  }

  getServerStatus(serverId: string): MCPServerStatus {
    const server = this.servers.get(serverId);
    return server ? server.status : MCPServerStatus.OFFLINE;
  }

  listServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }
}
