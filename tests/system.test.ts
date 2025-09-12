import { CodexBetaSystem } from '../src/core/system';
import { AgentRegistry } from '../src/agents/registry';
import { Logger } from '../src/core/logger';

describe('CodexBetaSystem', () => {
  let system: CodexBetaSystem;

  beforeEach(() => {
    system = new CodexBetaSystem();
  });

  afterEach(async () => {
    if (system.isReady()) {
      await system.shutdown();
    }
  });

  test('should create system instance', () => {
    expect(system).toBeInstanceOf(CodexBetaSystem);
    expect(system.isReady()).toBe(false);
  });

  test('should initialize successfully', async () => {
    await system.initialize();
    expect(system.isReady()).toBe(true);
  });

  test('should shutdown successfully', async () => {
    await system.initialize();
    expect(system.isReady()).toBe(true);
    
    await system.shutdown();
    expect(system.isReady()).toBe(false);
  });

  test('should provide access to core components', async () => {
    await system.initialize();
    
    expect(system.getAgentRegistry()).toBeInstanceOf(AgentRegistry);
    expect(system.getTaskScheduler()).toBeDefined();
    expect(system.getNeuralMesh()).toBeDefined();
    expect(system.getSwarmCoordinator()).toBeDefined();
    expect(system.getConsensusManager()).toBeDefined();
    expect(system.getMCPBridge()).toBeDefined();
    expect(system.getA2ABridge()).toBeDefined();
  });

  test('should return system status', async () => {
    await system.initialize();
    
    const status = system.getStatus();
    expect(status).toHaveProperty('initialized', true);
    expect(status).toHaveProperty('shuttingDown', false);
    expect(status).toHaveProperty('components');
  });
});