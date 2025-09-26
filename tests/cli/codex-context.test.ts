import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CodexContextBuilder,
  composePromptWithContext,
  renderCodexContextBlock
} from '../../src/cli/codex-context';

const writeFile = (filePath: string, content: string) => {
  fs.mkdirSync(dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
};

describe('CodexContextBuilder', () => {
  it('assembles directives, README excerpts, directories, and database metadata', async () => {
    const tempRoot = fs.mkdtempSync(join(tmpdir(), 'codex-context-'));
    try {
      writeFile(join(tempRoot, 'README.md'), '# Project\n\n## Overview\nContext for the project.');
      writeFile(join(tempRoot, 'AGENTS.md'), '# Agent Instructions\n- Must follow safety protocols.');

      const codexDir = join(tempRoot, '.codex-synaptic');
      fs.mkdirSync(codexDir, { recursive: true });
      writeFile(join(codexDir, 'notes.txt'), 'Persistent state');

      writeFile(join(tempRoot, '.codex-synaptic', 'memory.db'), 'db');
      writeFile(join(tempRoot, 'analytics.db'), 'metrics');

      const builder = new CodexContextBuilder(tempRoot);
      await builder.withAgentDirectives();
      await builder.withReadmeExcerpts();
      await builder.withDirectoryInventory();
      await builder.withDatabaseMetadata();
      const result = await builder.build();

      expect(result.context.agentDirectives).toContain('Agent Instructions');
      expect(result.context.readmeExcerpts.length).toBeGreaterThan(0);
      expect(result.metadata.agentGuideCount).toBe(1);
      expect(result.metadata.codexDirectoryCount).toBeGreaterThan(0);
      expect(result.context.directoryInventory.roots[0].path).toContain('.codex');
      expect(result.context.databaseMetadata.length).toBeGreaterThanOrEqual(1);

      const block = renderCodexContextBlock(result.context);
      expect(block).toContain('Context Hash');

      const augmented = composePromptWithContext('Build a dashboard', result.context);
      expect(augmented).toContain('### TASK PROMPT');
      expect(augmented).toContain('Build a dashboard');
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('falls back to default directives when AGENTS.md is missing', async () => {
    const tempRoot = fs.mkdtempSync(join(tmpdir(), 'codex-context-missing-'));
    try {
      writeFile(join(tempRoot, 'README.md'), '# Project\n\n## Usage\nUse the tool.');

      const builder = new CodexContextBuilder(tempRoot);
      await builder.withAgentDirectives();
      await builder.withReadmeExcerpts();
      const result = await builder.build();

      expect(result.context.agentDirectives).toContain('Default Directives');
      expect(result.logs.some((entry) => entry.message.includes('AGENTS.md not found'))).toBe(true);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('reuses cached context when inputs have not changed', async () => {
    const tempRoot = fs.mkdtempSync(join(tmpdir(), 'codex-context-cache-'));
    try {
      writeFile(join(tempRoot, 'README.md'), '# Project\n\n## Cache\nCache check.');
      writeFile(join(tempRoot, 'AGENTS.md'), '# Agent Instructions\n- Cache.');

      const initialBuilder = new CodexContextBuilder(tempRoot);
      await initialBuilder.withAgentDirectives();
      await initialBuilder.withReadmeExcerpts();
      await initialBuilder.withDirectoryInventory();
      await initialBuilder.withDatabaseMetadata();
      const first = await initialBuilder.build();

      expect(first.context.contextHash).toBeTruthy();

      const second = await new CodexContextBuilder(tempRoot).build();
      expect(second.logs.some((entry) => entry.message.includes('Codex context cache hit'))).toBe(true);
      expect(second.context.contextHash).toBe(first.context.contextHash);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
