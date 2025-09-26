import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { scanRepository, type AgentsGuide } from '../core/scanner.js';
import type {
  CodexContext,
  CodexContextAggregationMetadata,
  CodexDatabaseMetadata,
  ContextLogEntry,
  DirectoryInventory,
  FileTreeNode
} from '../types/codex-context.js';

const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '.cache',
  '.venv',
  '__pycache__'
]);

const DEFAULT_AGENT_DIRECTIVES = `# Codex-Synaptic Default Directives\n\n- Preserve sandbox integrity.\n- Honor all AGENTS.md directives by scope.\n- Maintain transparent logging for Codex orchestration.\n- Defer to Codex operator input on ambiguities.`;

const MAX_AGENT_BYTES = 48_000;
const MAX_README_CHARS = 8_000;
const MAX_README_SECTIONS = 4;
const MAX_CONTEXT_BYTES = 120_000;
const MAX_DIRECTORY_DEPTH = 3;
const MAX_DIRECTORY_ROOTS = 12;
const MAX_DIRECTORY_CHILDREN = 20;
const MAX_DATABASE_FILES = 24;

const DATABASE_EXTENSIONS = ['.db', '.sqlite', '.sqlite3'];

interface WatchInfo {
  mtimeMs: number;
  size: number;
}

interface CachedContext {
  context: CodexContext;
  watches: Record<string, WatchInfo>;
  metadata: CodexContextAggregationMetadata;
}

const contextCache = new Map<string, CachedContext>();

interface ArtifactScanResult {
  directories: FileTreeNode[];
  totalEntries: number;
  databases: CodexDatabaseMetadata[];
  watches: Record<string, WatchInfo>;
}

export interface CodexContextBuilderOptions {
  useCache?: boolean;
}

export interface CodexContextBuildResult {
  context: CodexContext;
  logs: ContextLogEntry[];
  metadata: CodexContextAggregationMetadata;
}

export class CodexContextBuilder {
  private readonly root: string;
  private readonly useCache: boolean;
  private logs: ContextLogEntry[] = [];
  private partial: Partial<CodexContext> = {};
  private watches: Record<string, WatchInfo> = {};
  private report?: { guides: AgentsGuide[] };
  private artifacts?: ArtifactScanResult;
  private metadata: CodexContextAggregationMetadata = {
    agentGuideCount: 0,
    codexDirectoryCount: 0,
    databaseCount: 0
  };

  constructor(rootDir: string, options: CodexContextBuilderOptions = {}) {
    this.root = path.resolve(rootDir);
    this.useCache = options.useCache !== false;
  }

  async withAgentDirectives(): Promise<this> {
    if (this.partial.agentDirectives) {
      return this;
    }

    const guides = await this.loadAgentGuides();
    this.metadata.agentGuideCount = guides.length;
    if (!guides.length) {
      this.partial.agentDirectives = DEFAULT_AGENT_DIRECTIVES;
      this.logs.push({ level: 'warn', message: 'AGENTS.md not found – using default Codex directives.' });
      return this;
    }

    const segments: string[] = [];
    let accumulated = 0;
    for (const guide of guides) {
      const buffer = Buffer.from(guide.content, 'utf8');
      const bytes = buffer.byteLength;
      const fullPath = path.join(this.root, guide.path);
      if (accumulated + bytes > MAX_AGENT_BYTES) {
        const remaining = Math.max(0, MAX_AGENT_BYTES - accumulated);
        if (remaining <= 0) {
          this.logs.push({
            level: 'warn',
            message: 'AGENTS.md content truncated to respect context size limit.',
            details: { limitBytes: MAX_AGENT_BYTES }
          });
          break;
        }
        segments.push(buffer.subarray(0, remaining).toString('utf8'));
        accumulated += remaining;
        this.trackWatch(fullPath);
        this.logs.push({
          level: 'warn',
          message: `AGENTS.md content truncated for ${guide.path}.`,
          details: { path: guide.path, retainedBytes: remaining }
        });
        break;
      }
      segments.push(guide.content);
      accumulated += bytes;
      this.trackWatch(fullPath);
      this.logs.push({
        level: 'info',
        message: 'Loaded AGENTS.md directives.',
        details: { path: guide.path, bytes }
      });
    }

    this.partial.agentDirectives = segments.join('\n\n');
    return this;
  }

  async withReadmeExcerpts(): Promise<this> {
    if (this.partial.readmeExcerpts) {
      return this;
    }

    const readmePath = path.join(this.root, 'README.md');
    const excerpts: string[] = [];

    try {
      const content = fs.readFileSync(readmePath, 'utf8');
      this.trackWatch(readmePath);
      const sections = extractReadmeSections(content, MAX_README_SECTIONS, MAX_README_CHARS);
      excerpts.push(...sections);
      this.logs.push({
        level: 'info',
        message: 'Captured README.md excerpts for Codex context.',
        details: { sections: sections.length }
      });
    } catch (error) {
      this.logs.push({
        level: 'warn',
        message: 'README.md not accessible – skipping excerpts.',
        details: { error: (error as Error).message }
      });
    }

    this.partial.readmeExcerpts = excerpts;
    return this;
  }

  async withDirectoryInventory(): Promise<this> {
    if (this.partial.directoryInventory) {
      return this;
    }

    const artifacts = this.ensureArtifacts();
    this.partial.directoryInventory = {
      roots: artifacts.directories,
      totalEntries: artifacts.totalEntries
    } as DirectoryInventory;
    this.metadata.codexDirectoryCount = artifacts.directories.length;

    Object.assign(this.watches, artifacts.watches);
    if (artifacts.directories.length) {
      this.logs.push({
        level: 'info',
        message: 'Catalogued .codex* directories.',
        details: { directories: artifacts.directories.length, totalEntries: artifacts.totalEntries }
      });
    } else {
      this.logs.push({ level: 'warn', message: 'No .codex* directories detected during scan.' });
    }

    return this;
  }

  async withDatabaseMetadata(): Promise<this> {
    if (this.partial.databaseMetadata) {
      return this;
    }

    const artifacts = this.ensureArtifacts();
    this.partial.databaseMetadata = artifacts.databases;
    this.metadata.databaseCount = artifacts.databases.length;
    Object.assign(this.watches, artifacts.watches);

    if (artifacts.databases.length) {
      this.logs.push({
        level: 'info',
        message: 'Indexed Codex database artifacts.',
        details: { count: artifacts.databases.length }
      });
    } else {
      this.logs.push({ level: 'warn', message: 'No database artifacts (*.db, *.sqlite*) located.' });
    }

    return this;
  }

  async build(): Promise<CodexContextBuildResult> {
    if (this.useCache) {
      const cached = getCachedContext(this.root);
      if (cached) {
        const cloned = cloneContext(cached.context);
        cloned.timestamp = new Date();
        this.metadata = { ...cached.metadata };
        this.logs.push({ level: 'info', message: 'Codex context cache hit.', details: { contextHash: cached.context.contextHash } });
        return { context: cloned, logs: [...this.logs], metadata: { ...cached.metadata } };
      }
    }

    await this.withAgentDirectives();
    await this.withReadmeExcerpts();
    await this.withDirectoryInventory();
    await this.withDatabaseMetadata();

    const context = this.finalize();
    if (this.useCache) {
      setCachedContext(this.root, context, this.collectWatches(), this.metadata);
    }

    return { context, logs: [...this.logs], metadata: { ...this.metadata } };
  }

  private async loadAgentGuides(): Promise<AgentsGuide[]> {
    if (!this.report) {
      const report = await scanRepository(this.root);
      this.report = { guides: report.agentsGuides.sort((a, b) => a.path.localeCompare(b.path)) };
    }
    return this.report.guides;
  }

  private ensureArtifacts(): ArtifactScanResult {
    if (this.artifacts) {
      return this.artifacts;
    }
    const result = scanForArtifacts(this.root, this.logs);
    this.artifacts = result;
    return result;
  }

  private collectWatches(): Record<string, WatchInfo> {
    const aggregated: Record<string, WatchInfo> = { ...this.watches };
    if (this.report) {
      for (const guide of this.report.guides) {
        const guidePath = path.join(this.root, guide.path);
        const watch = getWatchInfo(guidePath);
        if (watch) {
          aggregated[guidePath] = watch;
        }
      }
    }
    if (this.partial.readmeExcerpts?.length) {
      const readme = path.join(this.root, 'README.md');
      const watch = getWatchInfo(readme);
      if (watch) {
        aggregated[readme] = watch;
      }
    }
    return aggregated;
  }

  private finalize(): CodexContext {
    const context: CodexContext = {
      agentDirectives: this.partial.agentDirectives ?? DEFAULT_AGENT_DIRECTIVES,
      readmeExcerpts: this.partial.readmeExcerpts ?? [],
      directoryInventory: this.partial.directoryInventory ?? { roots: [], totalEntries: 0 },
      databaseMetadata: this.partial.databaseMetadata ?? [],
      timestamp: new Date(),
      contextHash: '',
      sizeBytes: 0,
      warnings: this.logs.filter((entry) => entry.level === 'warn').map((entry) => entry.message)
    };

    let serialized = JSON.stringify(
      {
        ...context,
        timestamp: context.timestamp.toISOString()
      },
      null,
      2
    );

    let contextBytes = Buffer.byteLength(serialized, 'utf8');
    if (contextBytes > MAX_CONTEXT_BYTES) {
      this.logs.push({
        level: 'warn',
        message: 'Codex context exceeds recommended size – trimming agent directives.',
        details: { sizeBytes: contextBytes, limitBytes: MAX_CONTEXT_BYTES }
      });
      const directiveBytes = Buffer.byteLength(context.agentDirectives, 'utf8');
      const allowedDirectiveBytes = Math.max(0, MAX_CONTEXT_BYTES - (contextBytes - directiveBytes));
      context.agentDirectives = truncateUtf8(context.agentDirectives, allowedDirectiveBytes);
      serialized = JSON.stringify(
        {
          ...context,
          timestamp: context.timestamp.toISOString()
        },
        null,
        2
      );
      contextBytes = Buffer.byteLength(serialized, 'utf8');
    }

    context.contextHash = createHash('sha256').update(serialized).digest('hex');
    context.sizeBytes = contextBytes;
    return context;
  }

  private trackWatch(target: string): void {
    const info = getWatchInfo(target);
    if (info) {
      this.watches[target] = info;
    }
  }
}

export function renderCodexContextBlock(context: CodexContext): string {
  const lines: string[] = [];
  lines.push('### CODEX SYNAPTIC CONTEXT SNAPSHOT');
  lines.push(`Timestamp: ${context.timestamp.toISOString()}`);
  lines.push(`Context Hash: ${context.contextHash}`);
  lines.push(`Context Size: ${context.sizeBytes} bytes`);
  if (context.warnings.length) {
    lines.push('Warnings:');
    for (const warning of context.warnings) {
      lines.push(`- ${warning}`);
    }
  }
  lines.push('');

  lines.push('#### Agent Directives');
  lines.push(context.agentDirectives.trim());
  lines.push('');

  if (context.readmeExcerpts.length) {
    lines.push('#### README Highlights');
    context.readmeExcerpts.forEach((excerpt, index) => {
      lines.push(`Section ${index + 1}:`);
      lines.push(indentBlock(excerpt.trim(), 2));
      lines.push('');
    });
  }

  if (context.directoryInventory.roots.length) {
    lines.push('#### .codex* Directory Inventory');
    for (const rootNode of context.directoryInventory.roots) {
      renderDirectoryNode(rootNode, 0, lines);
    }
    lines.push('');
  }

  if (context.databaseMetadata.length) {
    lines.push('#### Database Metadata');
    for (const db of context.databaseMetadata) {
      lines.push(`- ${db.path} — ${db.sizeBytes} bytes${db.engine ? ` (${db.engine})` : ''}` + (db.lastModified ? ` — updated ${db.lastModified}` : ''));
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

export function composePromptWithContext(prompt: string, context: CodexContext): string {
  const contextBlock = renderCodexContextBlock(context);
  return `${contextBlock}\n\n### TASK PROMPT\n${prompt.trim()}`;
}

function getCachedContext(root: string): CachedContext | undefined {
  const cached = contextCache.get(root);
  if (!cached) {
    return undefined;
  }

  for (const [target, info] of Object.entries(cached.watches)) {
    try {
      const stats = fs.statSync(target);
      if (stats.mtimeMs !== info.mtimeMs || stats.size !== info.size) {
        return undefined;
      }
    } catch {
      return undefined;
    }
  }
  return cached;
}

function setCachedContext(
  root: string,
  context: CodexContext,
  watches: Record<string, WatchInfo>,
  metadata: CodexContextAggregationMetadata
): void {
  contextCache.set(root, {
    context: cloneContext(context),
    watches: { ...watches },
    metadata: { ...metadata }
  });
}

function cloneContext(context: CodexContext): CodexContext {
  return {
    agentDirectives: context.agentDirectives,
    readmeExcerpts: [...context.readmeExcerpts],
    directoryInventory: cloneInventory(context.directoryInventory),
    databaseMetadata: context.databaseMetadata.map((db) => ({ ...db })),
    timestamp: new Date(context.timestamp.getTime()),
    contextHash: context.contextHash,
    sizeBytes: context.sizeBytes,
    warnings: [...context.warnings]
  };
}

function cloneInventory(inventory: DirectoryInventory): DirectoryInventory {
  return {
    roots: inventory.roots.map(cloneNode),
    totalEntries: inventory.totalEntries
  };
}

function cloneNode(node: FileTreeNode): FileTreeNode {
  return {
    name: node.name,
    path: node.path,
    type: node.type,
    sizeBytes: node.sizeBytes,
    children: node.children ? node.children.map(cloneNode) : undefined
  };
}

function getWatchInfo(target: string): WatchInfo | undefined {
  try {
    const stats = fs.statSync(target);
    return { mtimeMs: stats.mtimeMs, size: stats.size };
  } catch {
    return undefined;
  }
}

function scanForArtifacts(root: string, logs: ContextLogEntry[]): ArtifactScanResult {
  const directories: FileTreeNode[] = [];
  const databases: CodexDatabaseMetadata[] = [];
  const watches: Record<string, WatchInfo> = {};
  let totalEntries = 0;

  const queue: Array<{ dir: string; depth: number }>= [{ dir: root, depth: 0 }];

  while (queue.length) {
    const current = queue.shift()!;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(current.dir, { withFileTypes: true });
    } catch (error) {
      logs.push({
        level: 'warn',
        message: 'Unable to read directory during Codex artifact scan.',
        details: { path: current.dir, error: (error as Error).message }
      });
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current.dir, entry.name);
      const relPath = path.relative(root, fullPath) || '.';

      if (entry.isDirectory()) {
        if (entry.name.startsWith('.codex')) {
          if (directories.length < MAX_DIRECTORY_ROOTS) {
            const tree = buildDirectoryTree(fullPath, root, 0);
            directories.push(tree);
            const watch = getWatchInfo(fullPath);
            if (watch) {
              watches[fullPath] = watch;
            }
            totalEntries += countTreeNodes(tree);
          }
        }
        if (!EXCLUDE_DIRS.has(entry.name) && current.depth < MAX_DIRECTORY_DEPTH) {
          queue.push({ dir: fullPath, depth: current.depth + 1 });
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (DATABASE_EXTENSIONS.includes(ext) && databases.length < MAX_DATABASE_FILES) {
          try {
            const stats = fs.statSync(fullPath);
            const metadata: CodexDatabaseMetadata = {
              path: relPath,
              sizeBytes: stats.size,
              lastModified: new Date(stats.mtimeMs).toISOString(),
              engine: inferDatabaseEngine(entry.name)
            };
            databases.push(metadata);
            watches[fullPath] = { mtimeMs: stats.mtimeMs, size: stats.size };
          } catch (error) {
            logs.push({
              level: 'warn',
              message: 'Failed to stat database artifact.',
              details: { path: relPath, error: (error as Error).message }
            });
          }
        }
      }
    }
  }

  return { directories, totalEntries, databases, watches };
}

function buildDirectoryTree(target: string, root: string, depth: number): FileTreeNode {
  const name = path.basename(target);
  const rel = path.relative(root, target) || name;
  const node: FileTreeNode = {
    name,
    path: rel,
    type: 'directory',
    children: []
  };

  if (depth >= MAX_DIRECTORY_DEPTH) {
    return node;
  }

  let children: fs.Dirent[] = [];
  try {
    children = fs.readdirSync(target, { withFileTypes: true });
  } catch {
    return node;
  }

  for (const child of children.slice(0, MAX_DIRECTORY_CHILDREN)) {
    const childPath = path.join(target, child.name);
    const relChild = path.relative(root, childPath) || child.name;
    if (child.isDirectory()) {
      node.children!.push(buildDirectoryTree(childPath, root, depth + 1));
    } else {
      let size = 0;
      try {
        size = fs.statSync(childPath).size;
      } catch {}
      node.children!.push({
        name: child.name,
        path: relChild,
        type: 'file',
        sizeBytes: size
      });
    }
  }

  if (!node.children?.length) {
    node.children = undefined;
  }

  return node;
}

function countTreeNodes(node: FileTreeNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countTreeNodes(child);
    }
  }
  return count;
}

function inferDatabaseEngine(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.sqlite') || lower.endsWith('.sqlite3')) {
    return 'sqlite';
  }
  if (lower.endsWith('.db')) {
    return 'sqlite';
  }
  return 'unknown';
}

function extractReadmeSections(content: string, maxSections: number, maxChars: number): string[] {
  const normalized = content.replace(/\r\n/g, '\n');
  const sections: string[] = [];
  const pattern = /^(##\s+.+)$/gm;
  let match: RegExpExecArray | null;
  const indices: number[] = [];

  while ((match = pattern.exec(normalized)) !== null) {
    indices.push(match.index);
  }

  if (!indices.length) {
    return [truncateUtf8(normalized.trim(), maxChars)];
  }

  for (let i = 0; i < indices.length && sections.length < maxSections; i++) {
    const start = indices[i];
    const end = indices[i + 1] ?? normalized.length;
    const section = normalized.slice(start, end).trim();
    sections.push(truncateUtf8(section, Math.floor(maxChars / maxSections)));
  }

  return sections;
}

function truncateUtf8(value: string, maxBytes: number): string {
  if (maxBytes <= 0) {
    return '';
  }
  const buffer = Buffer.from(value, 'utf8');
  if (buffer.byteLength <= maxBytes) {
    return value;
  }
  return buffer.subarray(0, maxBytes).toString('utf8').trimEnd() + '…';
}

function indentBlock(block: string, spaces: number): string {
  const prefix = ' '.repeat(spaces);
  return block
    .split('\n')
    .map((line) => (line.length ? prefix + line : line))
    .join('\n');
}

function renderDirectoryNode(node: FileTreeNode, depth: number, lines: string[]): void {
  const indent = '  '.repeat(depth);
  lines.push(`${indent}- ${node.path}`);
  if (node.children) {
    for (const child of node.children) {
      renderDirectoryNode(child, depth + 1, lines);
    }
  }
}
