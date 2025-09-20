import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CodexBetaSystem } from '../../src/core/system';

let system: CodexBetaSystem;

describe('Swarm self-learning capability', () => {
  beforeAll(async () => {
    system = new CodexBetaSystem();
    await system.initialize();
  });

  afterAll(async () => {
    await system.shutdown();
  });

  it('activates swarm optimization with adaptive particles', async () => {
    await system.startSwarm('pso', ['latency']);

    try {
      const status = system.getSwarmCoordinator().getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.particleCount).toBeGreaterThan(0);

      await new Promise((resolve) => setTimeout(resolve, 1200));
      const updatedStatus = system.getSwarmCoordinator().getStatus();
      expect(updatedStatus.isOptimizing).toBe(true);
    } finally {
      system.getSwarmCoordinator().stopSwarm();
    }
  });
});
