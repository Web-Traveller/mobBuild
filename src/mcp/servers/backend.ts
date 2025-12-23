import { MCPServer, MCPServerType, MCPServerStatus } from '../../types/mcp';

export const backendMCPServer: MCPServer = {
  id: 'backend-mcp-server',
  name: 'Backend MCP Server',
  type: MCPServerType.BACKEND,
  endpoint: 'http://localhost:3001/backend',
  status: MCPServerStatus.IDLE,
  capabilities: [
    {
      name: 'generate_api_endpoint',
      description: 'Generate RESTful API endpoint with Express/Fastify',
      inputSchema: {
        type: 'object',
        properties: {
          method: { type: 'string' },
          path: { type: 'string' },
          handler: { type: 'string' },
        },
      },
    },
    {
      name: 'generate_middleware',
      description: 'Generate Express/Fastify middleware',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
        },
      },
    },
  ],
};
