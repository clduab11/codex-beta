/**
 * Integration test for Codex-Beta System
 * Tests the complete system workflow
 */

import { CodexBetaSystem } from '../src/core/system';
import { AgentType, AgentStatus } from '../src/core/types';

describe('Codex-Beta System Integration', () => {
  let system: CodexBetaSystem;

  beforeAll(async () => {
    system = new CodexBetaSystem();
    await system.initialize();
  });

  afterAll(async () => {
    await system.shutdown();
  });

  test('should support full agent lifecycle', async () => {
    const agentRegistry = system.getAgentRegistry();
    
    // Register an agent
    const testAgent = {
      id: { id: 'integration-agent-1', type: AgentType.CODE_WORKER, version: '1.0.0' },
      capabilities: [
        { name: 'code-generation', version: '1.0.0', description: 'Generate code', parameters: {} }
      ],
      resources: { cpu: 2, memory: 1024, storage: 512, bandwidth: 100 },
      networkInfo: { address: '127.0.0.1', port: 8080, protocol: 'tcp' as const, endpoints: [] },
      status: AgentStatus.IDLE,
      created: new Date(),
      lastUpdated: new Date()
    };
    
    agentRegistry.registerAgent(testAgent);
    expect(agentRegistry.getAgentCount()).toBe(1);
    
    // Update agent status
    agentRegistry.updateAgentStatus(testAgent.id, AgentStatus.BUSY);
    const updatedAgent = agentRegistry.getAgent(testAgent.id);
    expect(updatedAgent?.status).toBe(AgentStatus.BUSY);
    
    // Unregister agent
    agentRegistry.unregisterAgent(testAgent.id);
    expect(agentRegistry.getAgentCount()).toBe(0);
  });

  test('should support task submission and scheduling', async () => {
    const agentRegistry = system.getAgentRegistry();
    const taskScheduler = system.getTaskScheduler();
    
    // Register an agent first
    const agent = {
      id: { id: 'task-agent-1', type: AgentType.CODE_WORKER, version: '1.0.0' },
      capabilities: [
        { name: 'code-generation', version: '1.0.0', description: 'Generate code', parameters: {} }
      ],
      resources: { cpu: 2, memory: 1024, storage: 512, bandwidth: 100 },
      networkInfo: { address: '127.0.0.1', port: 8080, protocol: 'tcp' as const, endpoints: [] },
      status: AgentStatus.IDLE,
      created: new Date(),
      lastUpdated: new Date()
    };
    
    agentRegistry.registerAgent(agent);
    
    // Submit a task
    const task = taskScheduler.submitTask({
      type: 'code_generation',
      requiredCapabilities: ['code-generation'],
      payload: { language: 'typescript', description: 'Create API' }
    });
    
    expect(task).toBeDefined();
    expect(task.type).toBe('code_generation');
    
    // Wait for task assignment
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const schedulerStatus = taskScheduler.getStatus();
    expect(schedulerStatus.runningTasks).toBeGreaterThan(0);
  });

  test('should support consensus proposals', async () => {
    const consensusManager = system.getConsensusManager();
    
    const proposalId = consensusManager.proposeConsensus(
      'test_proposal',
      { message: 'Test consensus proposal' },
      { id: 'test-proposer', type: AgentType.SWARM_COORDINATOR, version: '1.0.0' }
    );
    
    expect(proposalId).toBeDefined();
    
    const proposal = consensusManager.getProposal(proposalId);
    expect(proposal).toBeDefined();
    expect(proposal?.type).toBe('test_proposal');
  });

  test('should support neural mesh operations', async () => {
    const neuralMesh = system.getNeuralMesh();
    const agentRegistry = system.getAgentRegistry();
    
    // Register multiple agents to create mesh
    const agents = [
      { id: 'mesh-agent-1', type: AgentType.CODE_WORKER },
      { id: 'mesh-agent-2', type: AgentType.DATA_WORKER },
      { id: 'mesh-agent-3', type: AgentType.VALIDATION_WORKER }
    ].map(({ id, type }) => ({
      id: { id, type, version: '1.0.0' },
      capabilities: [
        { name: 'basic-capability', version: '1.0.0', description: 'Basic capability', parameters: {} }
      ],
      resources: { cpu: 1, memory: 512, storage: 256, bandwidth: 50 },
      networkInfo: { address: '127.0.0.1', port: 8080, protocol: 'tcp' as const, endpoints: [] },
      status: AgentStatus.IDLE,
      created: new Date(),
      lastUpdated: new Date()
    }));
    
    agents.forEach(agent => agentRegistry.registerAgent(agent));
    
    // Wait for mesh to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const meshStatus = neuralMesh.getStatus();
    expect(meshStatus.nodeCount).toBeGreaterThan(0);
  });

  test('should provide comprehensive system status', () => {
    const status = system.getStatus();
    
    expect(status).toHaveProperty('initialized', true);
    expect(status).toHaveProperty('shuttingDown', false);
    expect(status).toHaveProperty('components');
    
    const components = status.components;
    expect(components).toHaveProperty('agentRegistry');
    expect(components).toHaveProperty('taskScheduler');
    expect(components).toHaveProperty('neuralMesh');
    expect(components).toHaveProperty('swarmCoordinator');
    expect(components).toHaveProperty('consensusManager');
    expect(components).toHaveProperty('mcpBridge');
    expect(components).toHaveProperty('a2aBridge');
  });
});