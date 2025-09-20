import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { ConfigurationManager, type SystemConfiguration } from '../../src/core/config';

describe('ConfigurationManager persistence', () => {
  it('saves updates and reloads persisted state', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'codex-config-'));
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpRoot);

    try {
      const manager = new ConfigurationManager();
      await manager.load();

      const initial = manager.get();
      const updatedSection: Partial<SystemConfiguration> = {
        system: { ...initial.system, maxAgents: initial.system.maxAgents + 5 }
      };

      manager.update(updatedSection);
      await manager.save();

      const reloaded = new ConfigurationManager();
      await reloaded.load();
      expect(reloaded.get().system.maxAgents).toBe(initial.system.maxAgents + 5);
    } finally {
      cwdSpy.mockRestore();
      rmSync(tmpRoot, { force: true, recursive: true });
    }
  });
});
