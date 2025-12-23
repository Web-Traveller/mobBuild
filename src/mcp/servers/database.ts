import { MCPServer, MCPServerType, MCPServerStatus } from '../../types/mcp';

export const databaseMCPServer: MCPServer = {
  id: 'database-mcp-server',
  name: 'Database MCP Server',
  type: MCPServerType.DATABASE,
  endpoint: 'http://localhost:3001/database',
  status: MCPServerStatus.IDLE,
  capabilities: [
    {
      name: 'generate_schema',
      description: 'Generate database schema definition',
      inputSchema: {
        type: 'object',
        properties: {
          tables: { type: 'array' },
          relations: { type: 'array' },
        },
      },
    },
    {
      name: 'generate_migration',
      description: 'Generate database migration scripts',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string' },
          changes: { type: 'object' },
        },
      },
    },
  ],
};
