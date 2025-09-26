import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const projectRoot = join(__dirname, '..', '..');

const runCli = (args: string[]) => {
  const output = execFileSync('node', ['dist/cli/index.js', ...args], {
    cwd: projectRoot,
    env: { ...process.env, CODEX_DEBUG: '0' },
    encoding: 'utf8'
  });
  return output;
};

describe('Codex-Synaptic CLI commands', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], {
      cwd: projectRoot,
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'pipe'
    });
  });

  it('reports when the system has not been started', () => {
    const output = runCli(['system', 'status']);
    expect(output).toContain('System not started');
  });

  it('shows empty recent task history by default', () => {
    const output = runCli(['task', 'recent']);
    expect(output).toContain('No tasks executed yet in this session');
  });

  it('previews Codex context when invoked with --codex --dry-run', () => {
    const output = runCli(['hive-mind', 'spawn', 'Smoke test prompt', '--codex', '--dry-run']);
    expect(output).toContain('Dry-run: Codex context ready');
    expect(output).toContain('Codex context summary');
    expect(output).toContain('Context hash');
  });
});
