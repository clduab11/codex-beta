import { MCPTool } from '../types';
import { CodexSwarm } from '../../swarm/codex-swarm';

export class SwarmInitTool implements MCPTool {
  name = 'swarm_init';
  description = 'Initialize swarm with topology and configuration';

  async execute(params: {
    topology: 'hierarchical' | 'mesh' | 'ring' | 'star';
    strategy?: string;
    maxAgents?: number;
  }) {
    const swarm = new CodexSwarm({
      topology: params.topology,
      strategy: params.strategy || 'auto',
      maxAgents: params.maxAgents || 8
    });

    await swarm.initialize();
    return {
      swarmId: swarm.id,
      topology: swarm.topology,
      status: 'initialized',
      agents: swarm.getAgentCount()
    };
  }
}
