import { CodexSwarm } from '../../src/swarm/codex-swarm';
import { CoordinationStrategy } from '../../src/coordination/coordination-engine';

describe('Swarm Coordination', () => {
  it('should coordinate multiple agents for complex task', async () => {
    const swarm = new CodexSwarm({ topology: 'hierarchical', strategy: 'parallel', maxAgents: 2 });
    const result = await swarm.orchestrateTask('Build full-stack application', CoordinationStrategy.PARALLEL);

    expect(result.completed).toBe(true);
    expect(result.agents.length).toBeGreaterThan(1);
  });
});
