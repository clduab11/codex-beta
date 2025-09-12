import { CodexQueen } from '../../src/agents/queen-agent';
import { AgentType } from '../../src/agents/worker-types';

describe('CodexQueen', () => {
  it('should spawn specialized workers', async () => {
    const queen = new CodexQueen();
    const worker = await queen.spawnWorker(
      AgentType.CODE_GENERATOR,
      ['javascript', 'typescript']
    );

    expect(worker.type).toBe(AgentType.CODE_GENERATOR);
    expect(worker.capabilities).toContain('javascript');
  });
});
