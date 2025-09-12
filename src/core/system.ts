/**
 * Main Codex-Beta System orchestrator
 */

import { EventEmitter } from 'events';
import { Logger } from './logger';
import { AgentRegistry } from '../agents/registry';
import { TaskScheduler } from './scheduler';
import { NeuralMesh } from '../mesh/neural-mesh';
import { SwarmCoordinator } from '../swarm/coordinator';
import { ConsensusManager } from '../consensus/manager';
import { MCPBridge } from '../bridging/mcp-bridge';
import { A2ABridge } from '../bridging/a2a-bridge';
import { ConfigurationManager } from './config';

export class CodexBetaSystem extends EventEmitter {
  private logger = Logger.getInstance();
  private agentRegistry: AgentRegistry;
  private taskScheduler: TaskScheduler;
  private neuralMesh: NeuralMesh;
  private swarmCoordinator: SwarmCoordinator;
  private consensusManager: ConsensusManager;
  private mcpBridge: MCPBridge;
  private a2aBridge: A2ABridge;
  private configManager: ConfigurationManager;
  private isInitialized = false;
  private isShuttingDown = false;

  constructor() {
    super();
    this.logger.info('system', 'Codex-Beta System created');
    
    // Initialize components
    this.configManager = new ConfigurationManager();
    this.agentRegistry = new AgentRegistry();
    this.taskScheduler = new TaskScheduler(this.agentRegistry);
    this.neuralMesh = new NeuralMesh(this.agentRegistry);
    this.swarmCoordinator = new SwarmCoordinator(this.agentRegistry);
    this.consensusManager = new ConsensusManager(this.agentRegistry);
    this.mcpBridge = new MCPBridge();
    this.a2aBridge = new A2ABridge(this.agentRegistry);
    
    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('system', 'System already initialized');
      return;
    }

    this.logger.info('system', 'Initializing Codex-Beta System...');

    try {
      // Load configuration
      await this.configManager.load();
      
      // Initialize components in dependency order
      await this.agentRegistry.initialize();
      await this.taskScheduler.initialize();
      await this.neuralMesh.initialize();
      await this.swarmCoordinator.initialize();
      await this.consensusManager.initialize();
      await this.mcpBridge.initialize();
      await this.a2aBridge.initialize();

      this.isInitialized = true;
      this.emit('initialized');
      
      this.logger.info('system', 'Codex-Beta System initialized successfully');
      
    } catch (error) {
      this.logger.error('system', 'Failed to initialize system', undefined, error as Error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('system', 'System already shutting down');
      return;
    }

    this.isShuttingDown = true;
    this.logger.info('system', 'Shutting down Codex-Beta System...');

    try {
      // Shutdown components in reverse dependency order
      await this.a2aBridge.shutdown();
      await this.mcpBridge.shutdown();
      await this.consensusManager.shutdown();
      await this.swarmCoordinator.shutdown();
      await this.neuralMesh.shutdown();
      await this.taskScheduler.shutdown();
      await this.agentRegistry.shutdown();

      this.emit('shutdown');
      this.logger.info('system', 'Codex-Beta System shutdown complete');
      
    } catch (error) {
      this.logger.error('system', 'Error during shutdown', undefined, error as Error);
      throw error;
    } finally {
      await this.logger.close();
    }
  }

  private setupEventHandlers(): void {
    // Agent Registry Events
    this.agentRegistry.on('agentRegistered', (agent) => {
      this.logger.info('system', 'Agent registered', { agentId: agent.id });
      this.emit('agentRegistered', agent);
    });

    this.agentRegistry.on('agentUnregistered', (agentId) => {
      this.logger.info('system', 'Agent unregistered', { agentId });
      this.emit('agentUnregistered', agentId);
    });

    // Task Scheduler Events
    this.taskScheduler.on('taskCompleted', (task) => {
      this.logger.info('system', 'Task completed', { taskId: task.id });
      this.emit('taskCompleted', task);
    });

    this.taskScheduler.on('taskFailed', (task) => {
      this.logger.warn('system', 'Task failed', { taskId: task.id, error: task.error });
      this.emit('taskFailed', task);
    });

    // Neural Mesh Events
    this.neuralMesh.on('topologyChanged', (topology) => {
      this.logger.info('system', 'Neural mesh topology changed');
      this.emit('topologyChanged', topology);
    });

    // Consensus Events
    this.consensusManager.on('consensusReached', (proposal) => {
      this.logger.info('system', 'Consensus reached', { proposalId: proposal.id });
      this.emit('consensusReached', proposal);
    });

    // Error handling
    process.on('uncaughtException', (error) => {
      this.logger.fatal('system', 'Uncaught exception', undefined, error);
      this.shutdown().finally(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason) => {
      this.logger.fatal('system', 'Unhandled rejection', { reason });
      this.shutdown().finally(() => process.exit(1));
    });
  }

  // Public API methods
  getAgentRegistry(): AgentRegistry {
    return this.agentRegistry;
  }

  getTaskScheduler(): TaskScheduler {
    return this.taskScheduler;
  }

  getNeuralMesh(): NeuralMesh {
    return this.neuralMesh;
  }

  getSwarmCoordinator(): SwarmCoordinator {
    return this.swarmCoordinator;
  }

  getConsensusManager(): ConsensusManager {
    return this.consensusManager;
  }

  getMCPBridge(): MCPBridge {
    return this.mcpBridge;
  }

  getA2ABridge(): A2ABridge {
    return this.a2aBridge;
  }

  isReady(): boolean {
    return this.isInitialized && !this.isShuttingDown;
  }

  getStatus(): any {
    return {
      initialized: this.isInitialized,
      shuttingDown: this.isShuttingDown,
      components: {
        agentRegistry: this.agentRegistry.getStatus(),
        taskScheduler: this.taskScheduler.getStatus(),
        neuralMesh: this.neuralMesh.getStatus(),
        swarmCoordinator: this.swarmCoordinator.getStatus(),
        consensusManager: this.consensusManager.getStatus(),
        mcpBridge: this.mcpBridge.getStatus(),
        a2aBridge: this.a2aBridge.getStatus()
      }
    };
  }
}