import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentRegistry } from '../../src/agents/registry';
import { AgentId, AgentMetadata, AgentStatus, AgentType } from '../../src/core/types';

describe('AgentRegistry idle heartbeat publisher', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes idle agent heartbeats before the timeout window elapses', async () => {
    vi.useFakeTimers();
    const registry = new AgentRegistry();
    await registry.initialize();

    const heartbeatSpy = vi.fn();
    registry.on('heartbeat', heartbeatSpy);

    const agentId: AgentId = {
      id: 'agent-test-id',
      type: AgentType.CODE_WORKER,
      version: '1.0.0'
    };

    const metadata: AgentMetadata = {
      id: agentId,
      capabilities: [],
      resources: { cpu: 1, memory: 256, storage: 10, bandwidth: 10 },
      networkInfo: { address: 'localhost', port: 0, protocol: 'ws', endpoints: [] },
      status: AgentStatus.IDLE,
      created: new Date(Date.now() - 120_000),
      lastUpdated: new Date(Date.now() - 120_000)
    };

    registry.registerAgent(metadata);

    vi.advanceTimersByTime(20_000);

    expect(heartbeatSpy).toHaveBeenCalledWith(agentId, { synthetic: true });

    const stored = registry.getAgentByStringId(agentId.id);
    expect(stored).toBeDefined();
    expect(stored?.status).toBe(AgentStatus.IDLE);
    expect(Math.abs(stored!.lastUpdated.getTime() - Date.now())).toBeLessThanOrEqual(5);

    await registry.shutdown();
  });
});
