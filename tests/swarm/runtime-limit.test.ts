import { afterEach, describe, expect, it, vi } from 'vitest';
import { SwarmCoordinator } from '../../src/swarm/coordinator';
import { AgentRegistry } from '../../src/agents/registry';
import { SwarmConfiguration } from '../../src/core/types';

const createRegistryStub = () => ({
  on: vi.fn(),
  getAllAgents: () => []
}) as unknown as AgentRegistry;

describe('SwarmCoordinator run duration enforcement', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('terminates swarm optimization when the maximum duration expires', async () => {
    vi.useFakeTimers();
    const coordinator = new SwarmCoordinator(createRegistryStub());
    await coordinator.initialize();
    coordinator.setMaxRunDuration(1000);

    const timeoutSpy = vi.fn();
    const stoppedSpy = vi.fn();
    coordinator.on('swarmTimeout', timeoutSpy);
    coordinator.on('swarmStopped', stoppedSpy);

    const config: SwarmConfiguration = {
      algorithm: 'pso',
      parameters: {},
      objectives: ['latency'],
      constraints: []
    };

    coordinator.startSwarm(config);
    expect(coordinator.getStatus().isOptimizing).toBe(true);

    vi.advanceTimersByTime(1000);

    expect(timeoutSpy).toHaveBeenCalled();
    expect(stoppedSpy).toHaveBeenCalled();
    expect(stoppedSpy.mock.calls[0]?.[0]?.reason).toBe('timeout');
    expect(coordinator.getStatus().isOptimizing).toBe(false);

    await coordinator.shutdown();
  });
});
