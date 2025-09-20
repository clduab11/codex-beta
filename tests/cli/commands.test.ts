import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = join(__dirname, '..', '..');

const runCli = (args: string[]) => {
  const output = execFileSync('node', ['-r', 'ts-node/register/transpile-only', 'src/cli/index.ts', ...args], {
    cwd: projectRoot,
    env: { ...process.env, CODEX_DEBUG: '0' },
    encoding: 'utf8'
  });
  return output;
};

describe('Codex-Beta CLI commands', () => {
  it('reports when the system has not been started', () => {
    const output = runCli(['system', 'status']);
    expect(output).toContain('System not started');
  });

  it('shows empty recent task history by default', () => {
    const output = runCli(['task', 'recent']);
    expect(output).toContain('No tasks executed yet in this session');
  });
});
