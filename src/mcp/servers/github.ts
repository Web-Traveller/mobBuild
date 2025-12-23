import { MCPServer, MCPServerType, MCPServerStatus } from '../../types/mcp';

export const githubMCPServer: MCPServer = {
  id: 'github-mcp-server',
  name: 'GitHub MCP Server',
  type: MCPServerType.GITHUB,
  endpoint: 'http://localhost:3001/github',
  status: MCPServerStatus.IDLE,
  capabilities: [
    {
      name: 'create_repository',
      description: 'Create a new GitHub repository',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          private: { type: 'boolean' },
        },
      },
    },
    {
      name: 'commit_files',
      description: 'Commit files to a GitHub repository',
      inputSchema: {
        type: 'object',
        properties: {
          repository: { type: 'string' },
          files: { type: 'array' },
          message: { type: 'string' },
        },
      },
    },
  ],
};
