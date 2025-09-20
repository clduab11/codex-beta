import { afterEach, describe, expect, it, vi } from 'vitest';
import { NeuralMesh } from '../../src/mesh/neural-mesh';
import { AgentRegistry } from '../../src/agents/registry';

const createRegistryStub = () => ({
  on: vi.fn(),
  off: vi.fn()
}) as unknown as AgentRegistry;

describe('NeuralMesh run duration enforcement', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-stops dynamic updates when the configured duration elapses', async () => {
    vi.useFakeTimers();
    const mesh = new NeuralMesh(createRegistryStub());
    mesh.setMaxRunDuration(1000);

    const stopSpy = vi.fn();
    mesh.on('runStopped', stopSpy);

    await mesh.initialize();
    expect(mesh.getStatus().runActive).toBe(true);

    vi.advanceTimersByTime(1000);

    expect(stopSpy).toHaveBeenCalled();
    expect(stopSpy.mock.calls[0]?.[0]?.reason).toBe('timeout');
    expect(mesh.getStatus().runActive).toBe(false);

    await mesh.shutdown();
  });
});
