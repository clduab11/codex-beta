import { AgentRegistry } from '../src/agents/registry';
import { AgentType, AgentStatus, AgentMetadata } from '../src/core/types';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;

  beforeEach(async () => {
    registry = new AgentRegistry();
    await registry.initialize();
  });

  afterEach(async () => {
    await registry.shutdown();
  });

  const createTestAgent = (id: string = 'test-agent-1'): AgentMetadata => ({
    id: { id, type: AgentType.CODE_WORKER, version: '1.0.0' },
    capabilities: [
      { name: 'code-generation', version: '1.0.0', description: 'Generate code', parameters: {} }
    ],
    resources: { cpu: 2, memory: 1024, storage: 512, bandwidth: 100 },
    networkInfo: { address: '127.0.0.1', port: 8080, protocol: 'tcp', endpoints: [] },
    status: AgentStatus.IDLE,
    created: new Date(),
    lastUpdated: new Date()
  });

  test('should register an agent', () => {
    const agent = createTestAgent();
    registry.registerAgent(agent);
    
    expect(registry.getAgentCount()).toBe(1);
    expect(registry.getAgent(agent.id)).toEqual(agent);
  });

  test('should unregister an agent', () => {
    const agent = createTestAgent();
    registry.registerAgent(agent);
    expect(registry.getAgentCount()).toBe(1);
    
    registry.unregisterAgent(agent.id);
    expect(registry.getAgentCount()).toBe(0);
    expect(registry.getAgent(agent.id)).toBeUndefined();
  });

  test('should update agent status', () => {
    const agent = createTestAgent();
    registry.registerAgent(agent);
    
    registry.updateAgentStatus(agent.id, AgentStatus.BUSY);
    const updatedAgent = registry.getAgent(agent.id);
    
    expect(updatedAgent?.status).toBe(AgentStatus.BUSY);
  });

  test('should get agents by type', () => {
    const codeAgent = createTestAgent('agent-1');
    const dataAgent = { ...createTestAgent('agent-2'), id: { ...codeAgent.id, id: 'agent-2', type: AgentType.DATA_WORKER } };
    
    registry.registerAgent(codeAgent);
    registry.registerAgent(dataAgent);
    
    const codeWorkers = registry.getAgentsByType(AgentType.CODE_WORKER);
    const dataWorkers = registry.getAgentsByType(AgentType.DATA_WORKER);
    
    expect(codeWorkers).toHaveLength(1);
    expect(dataWorkers).toHaveLength(1);
    expect(codeWorkers[0].id.id).toBe(codeAgent.id.id);
    expect(dataWorkers[0].id.id).toBe(dataAgent.id.id);
  });

  test('should get available agents', () => {
    const agent1 = createTestAgent('agent-1');
    const agent2 = { ...createTestAgent('agent-2'), id: { ...agent1.id, id: 'agent-2' } };
    const agent3 = { ...createTestAgent('agent-3'), id: { ...agent1.id, id: 'agent-3' }, status: AgentStatus.ERROR };
    
    registry.registerAgent(agent1);
    registry.registerAgent(agent2);
    registry.registerAgent(agent3);
    
    const available = registry.getAvailableAgents();
    expect(available).toHaveLength(2);
    expect(available.some(a => a.id === agent3.id.id)).toBe(false);
  });

  test('should get agents with specific capability', () => {
    const agent1 = createTestAgent('agent-1');
    const agent2 = {
      ...createTestAgent('agent-2'),
      id: { ...agent1.id, id: 'agent-2' },
      capabilities: [
        { name: 'data-processing', version: '1.0.0', description: 'Process data', parameters: {} }
      ]
    };
    
    registry.registerAgent(agent1);
    registry.registerAgent(agent2);
    
    const codeAgents = registry.getAgentsWithCapability('code-generation');
    const dataAgents = registry.getAgentsWithCapability('data-processing');
    
    expect(codeAgents).toHaveLength(1);
    expect(dataAgents).toHaveLength(1);
  });
});