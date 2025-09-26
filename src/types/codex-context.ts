export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  sizeBytes?: number;
  children?: FileTreeNode[];
}

export interface DirectoryInventory {
  roots: FileTreeNode[];
  totalEntries: number;
}

export interface CodexDatabaseMetadata {
  path: string;
  sizeBytes: number;
  lastModified?: string;
  engine?: string;
}

export interface CodexContext {
  agentDirectives: string;
  readmeExcerpts: string[];
  directoryInventory: DirectoryInventory;
  databaseMetadata: CodexDatabaseMetadata[];
  timestamp: Date;
  contextHash: string;
  sizeBytes: number;
  warnings: string[];
}

export interface ContextLogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export interface CodexPromptEnvelope {
  originalPrompt: string;
  enrichedPrompt: string;
  contextBlock: string;
}

export interface CodexContextAggregationMetadata {
  agentGuideCount: number;
  codexDirectoryCount: number;
  databaseCount: number;
}
