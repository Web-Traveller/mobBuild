import { MCPServer, MCPServerType, MCPServerStatus } from '../../types/mcp';

export const frontendMCPServer: MCPServer = {
  id: 'frontend-mcp-server',
  name: 'Frontend MCP Server',
  type: MCPServerType.FRONTEND,
  endpoint: 'http://localhost:3001/frontend',
  status: MCPServerStatus.IDLE,
  capabilities: [
    {
      name: 'generate_react_component',
      description: 'Generate React component with TypeScript',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          props: { type: 'object' },
          styling: { type: 'string' },
        },
      },
    },
    {
      name: 'generate_page',
      description: 'Generate complete page with routing',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          components: { type: 'array' },
        },
      },
    },
  ],
};
