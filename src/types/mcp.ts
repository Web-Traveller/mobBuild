// MCP Server base interface
export interface MCPServer {
  name: string;
  version: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  isHealthy(): Promise<boolean>;
}

// Extended interface for servers that have tools
export interface MCPServerWithTools extends MCPServer {
  getTools(): MCPTool[];
}

// Extended interface for servers that have resources
export interface MCPServerWithResources extends MCPServer {
  getResources(): Array<{ uri: string; mimeType: string; content: string }>;
}

// Extended interface for servers that have both tools and resources
export interface MCPServerWithToolsAndResources extends MCPServer {
  getTools(): MCPTool[];
  getResources(): Array<{ uri: string; mimeType: string; content: string }>;
}

// MCP Tool interface (capabilities exposed by servers)
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, string>;
  execute(input: Record<string, unknown>): Promise<Record<string, unknown>>;
}

// MCP Resource interface (data/files managed by servers)
export interface MCPResource {
  uri: string;
  mimeType: string;
  readContent(): Promise<string>;
  writeContent(content: string): Promise<void>;
}

// Input types for better type safety
export interface BackendToolInput {
  endpoint?: string;
  method?: string;
  handlers?: string[];
  path?: string;
  controller?: string;
  environment?: string;
  config?: Record<string, unknown>;
}

export interface FrontendToolInput {
  name?: string;
  props?: Record<string, unknown>;
  styling?: string;
  path?: string;
  components?: string[];
  layout?: string;
  environment?: string;
  config?: Record<string, unknown>;
}

export interface DatabaseToolInput {
  tables?: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      nullable?: boolean;
      primaryKey?: boolean;
      autoIncrement?: boolean;
    }>;
    relations?: Array<{ type: string; table: string }>;
    constraints?: Array<{ type: string; columns: string[] }>;
  }>;
  relations?: Array<{ type: string; table: string }>;
  constraints?: Array<{ type: string; columns: string[] }>;
  name?: string;
  columns?: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    primaryKey?: boolean;
    autoIncrement?: boolean;
  }>;
  indexes?: Array<{ name: string; columns: string[] }>;
  operation?: string;
  changes?: { sql?: string };
  version?: string;
}

export interface GitHubToolInput {
  name?: string;
  description?: string;
  private?: boolean;
  repository?: string;
  files?: Array<{ path: string; content: string }>;
  message?: string;
  branch?: string;
  fromBranch?: string;
  workflow?: string;
  config?: Record<string, unknown>;
}

// MCP Orchestrator interface
export interface MCPOrchestrator {
  registerServer(server: MCPServer): Promise<void>;
  unregisterServer(name: string): Promise<void>;
  getServer(name: string): MCPServer | undefined;
  executeTool(
    serverName: string,
    toolName: string,
    input: Record<string, unknown>
  ): Promise<Record<string, unknown>>;
  getAllServers(): MCPServer[];
  healthCheck(): Promise<Map<string, boolean>>;
}
