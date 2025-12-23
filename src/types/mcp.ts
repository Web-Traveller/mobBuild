export interface MCPServer {
  id: string;
  name: string;
  type: MCPServerType;
  endpoint: string;
  status: MCPServerStatus;
  capabilities: MCPCapability[];
}

export enum MCPServerType {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  GITHUB = 'github',
  CUSTOM = 'custom',
}

export enum MCPServerStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  OFFLINE = 'offline',
}

export interface MCPCapability {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface MCPRequest {
  serverId: string;
  capability: string;
  payload: Record<string, unknown>;
  timeout?: number;
}

export interface MCPResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: MCPError;
  metadata?: MCPMetadata;
}

export interface MCPError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface MCPMetadata {
  serverId: string;
  timestamp: Date;
  duration: number;
}

export interface MCPOrchestrator {
  registerServer(server: MCPServer): void;
  unregisterServer(serverId: string): void;
  sendRequest<T>(request: MCPRequest): MCPResponse<T>;
  getServerStatus(serverId: string): MCPServerStatus;
  listServers(): MCPServer[];
}
