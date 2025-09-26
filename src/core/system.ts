/**
 * Main Codex-Synaptic System orchestrator
 */

import { EventEmitter } from 'events';
import { Logger, LogLevel } from './logger.js';
import { HealthMonitor } from './health.js';
import { AuthenticationManager, AuthMiddleware } from './auth.js';
import { GlobalErrorHandler, CircuitBreaker, SystemError, CodexSynapticError, ErrorCode } from './errors.js';
import { ResourceManager, AutoScaler, ResourceLimits } from './resources.js';
import { StorageManager } from './storage.js';
import { GPUManager, GPUStatus } from './gpu.js';
import { AgentRegistry } from '../agents/registry.js';
import { TaskScheduler } from './scheduler.js';
import { NeuralMesh } from '../mesh/neural-mesh.js';
import { SwarmCoordinator } from '../swarm/coordinator.js';
import { ConsensusManager } from '../consensus/manager.js';
import { MCPBridge } from '../bridging/mcp-bridge.js';
import { A2ABridge } from '../bridging/a2a-bridge.js';
import { ConfigurationManager, SystemConfiguration } from './config.js';
import { AgentType, AgentId, AgentStatus, Task, SwarmConfiguration } from './types.js';
import { CodeWorker } from '../agents/code_worker.js';
import { DataWorker } from '../agents/data_worker.js';
import { ValidationWorker } from '../agents/validation_worker.js';
import { SwarmCoordinator as SwarmCoordinatorAgent } from '../agents/swarm_coordinator.js';
import { TopologyCoordinator } from '../agents/topology_coordinator.js';
import { ConsensusCoordinator } from '../agents/consensus_coordinator.js';
import { MCPBridgeAgent } from '../agents/mcp_bridge_agent.js';
import { A2ABridgeAgent } from '../agents/a2a_bridge_agent.js';
import { Agent } from '../agents/agent.js';
import type { CodexContext, CodexPromptEnvelope, FileTreeNode } from '../types/codex-context.js';

interface WorkflowStage {
  id: string;
  label: string;
  taskType: string;
  requiredCapabilities: string[];
  priority: number;
  payloadBuilder: (context: WorkflowContext) => Record<string, any>;
}

function cloneCodexContext(context: CodexContext): CodexContext {
  return {
    agentDirectives: context.agentDirectives,
    readmeExcerpts: [...context.readmeExcerpts],
    directoryInventory: {
      roots: context.directoryInventory.roots.map(cloneFileTreeNode),
      totalEntries: context.directoryInventory.totalEntries
    },
    databaseMetadata: context.databaseMetadata.map((db) => ({ ...db })),
    timestamp: new Date(context.timestamp.getTime()),
    contextHash: context.contextHash,
    sizeBytes: context.sizeBytes,
    warnings: [...context.warnings]
  };
}

function cloneCodexEnvelope(envelope: CodexPromptEnvelope): CodexPromptEnvelope {
  return {
    originalPrompt: envelope.originalPrompt,
    enrichedPrompt: envelope.enrichedPrompt,
    contextBlock: envelope.contextBlock
  };
}

function cloneFileTreeNode(node: FileTreeNode): FileTreeNode {
  return {
    name: node.name,
    path: node.path,
    type: node.type,
    sizeBytes: node.sizeBytes,
    children: node.children ? node.children.map(cloneFileTreeNode) : undefined
  };
}

interface WorkflowContext {
  prompt: string;
  stageResults: Record<string, any>;
}

interface TaskPromiseTracker {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout?: NodeJS.Timeout;
}

export class CodexSynapticSystem extends EventEmitter {
  private logger = Logger.getInstance();
  private healthMonitor: HealthMonitor;
  private authManager: AuthenticationManager;
  private authMiddleware: AuthMiddleware;
  private globalErrorHandler: GlobalErrorHandler;
  private circuitBreaker: CircuitBreaker;
  private resourceManager: ResourceManager;
  private autoScaler: AutoScaler;
  private storageManager: StorageManager;
  private gpuManager: GPUManager;
  private agentRegistry: AgentRegistry;
  private taskScheduler: TaskScheduler;
  private neuralMesh: NeuralMesh;
  private swarmCoordinator: SwarmCoordinator;
  private consensusManager: ConsensusManager;
  private mcpBridge: MCPBridge;
  private a2aBridge: A2ABridge;
  private configManager: ConfigurationManager;
  private config?: SystemConfiguration;
  private isInitialized = false;
  private isShuttingDown = false;
  private taskPromises: Map<string, TaskPromiseTracker> = new Map();
  private codexSession?: {
    context: CodexContext;
    envelope: CodexPromptEnvelope;
    primedAt: Date;
  };
  private readonly onTaskAssigned = (agentId: AgentId, task: Task): void => {
    this.handleTaskAssignment(agentId, task).catch((error) => {
      this.logger.error('system', 'Agent task execution failed', {
        agentId: agentId.id,
        taskId: task.id
      }, error as Error);
    });
  };
  private readonly onTaskCompletedListener = (task: Task): void => {
    this.logger.info('system', 'Task completed', { taskId: task.id });
    this.resolveTaskPromise(task.id, task.result);
    if (task.assignedTo) {
      this.agentRegistry.updateAgentStatus(task.assignedTo, AgentStatus.IDLE);
      this.agentRegistry.reportHeartbeat(task.assignedTo);
    }
    this.emit('taskCompleted', task);
  };
  private readonly onTaskFailedListener = (task: Task): void => {
    this.logger.warn('system', 'Task failed', { taskId: task.id, error: task.error });
    this.rejectTaskPromise(task.id, task.error || 'Task failed');
    if (task.assignedTo) {
      this.agentRegistry.updateAgentStatus(task.assignedTo, AgentStatus.ERROR);
    }
    this.emit('taskFailed', task);
  };

  constructor() {
    super();
    this.logger.info('system', 'Codex-Synaptic System created');
    
    // Initialize core infrastructure
    this.configManager = new ConfigurationManager();
    this.authManager = new AuthenticationManager();
    this.authMiddleware = new AuthMiddleware(this.authManager);
    this.globalErrorHandler = GlobalErrorHandler.getInstance();
    this.circuitBreaker = new CircuitBreaker();
    
    // Initialize resource management
    const resourceLimits: ResourceLimits = {
      maxMemoryMB: 2048,
      maxCpuPercent: 80,
      maxActiveAgents: 50,
      maxConcurrentTasks: 100,
      maxRequestsPerMinute: 1000
    };
    this.resourceManager = new ResourceManager(resourceLimits);
    this.autoScaler = new AutoScaler(this.resourceManager);
    this.storageManager = new StorageManager();
    this.gpuManager = new GPUManager();
    
    // Initialize components
    this.agentRegistry = new AgentRegistry();
    this.taskScheduler = new TaskScheduler(this.agentRegistry);
    this.neuralMesh = new NeuralMesh(this.agentRegistry);
    this.swarmCoordinator = new SwarmCoordinator(this.agentRegistry);
    this.consensusManager = new ConsensusManager(this.agentRegistry);
    this.mcpBridge = new MCPBridge();
    this.a2aBridge = new A2ABridge(this.agentRegistry);
    this.healthMonitor = new HealthMonitor(this);
    
    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('system', 'System already initialized');
      return;
    }

    this.logger.info('system', 'Initializing Codex-Synaptic System...');

    try {
      // Initialize error handling first
      this.globalErrorHandler.initialize();
      
      // Load configuration
      await this.configManager.load();
      this.config = this.configManager.get();
      this.applyLoggerSettings();

      const meshRunDuration = this.config?.mesh?.maxRunDurationMs ?? 60 * 60 * 1000;
      const swarmRunDuration = this.config?.swarm?.maxRunDurationMs ?? 60 * 60 * 1000;
      this.neuralMesh.setMaxRunDuration(meshRunDuration);
      this.swarmCoordinator.setMaxRunDuration(swarmRunDuration);

      if (this.config?.gpu) {
        this.gpuManager.setProbeCacheOptions({
          disableCache: this.config.gpu.disableProbeCache,
          probeCacheTtlMs: this.config.gpu.probeCacheTtlMs
        });
      }

      // Initialize authentication system
      this.authManager.startPeriodicCleanup();
      
      // Initialize resource management
      this.resourceManager.initialize();

      // Initialize GPU detection
      await this.gpuManager.initialize();
      this.resourceManager.setGpuStatus(this.gpuManager.getStatus());

      // Initialize storage
      await this.storageManager.initialize();

      // Initialize components in dependency order with circuit breaker
      await this.circuitBreaker.execute(async () => {
        await this.agentRegistry.initialize();
        await this.taskScheduler.initialize();
        await this.neuralMesh.initialize();
        await this.swarmCoordinator.initialize();
        await this.consensusManager.initialize();
        await this.mcpBridge.initialize();
        await this.a2aBridge.initialize();
      });

      this.isInitialized = true;
      
      // Start health monitoring
      this.healthMonitor.startPeriodicHealthChecks();
      
      await this.connectConfiguredBridges();
      await this.bootstrapDefaultAgents();
      this.emit('initialized');
      
      this.logger.info('system', 'Codex-Synaptic System initialized successfully');
      
    } catch (error) {
      this.isInitialized = false;
      this.logger.error('system', 'Failed to initialize system', undefined, error as Error);
      throw new SystemError('System initialization failed', { error: (error as Error).message });
    }
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('system', 'System already shutting down');
      return;
    }

    this.isShuttingDown = true;
    this.logger.info('system', 'Shutting down Codex-Synaptic System...');

    this.healthMonitor.stopPeriodicHealthChecks();

    try {
      // Shutdown components in reverse dependency order
      await this.a2aBridge.shutdown();
      await this.mcpBridge.shutdown();
      await this.consensusManager.shutdown();
      await this.swarmCoordinator.shutdown();
      await this.neuralMesh.shutdown();
      await this.taskScheduler.shutdown();
      await this.agentRegistry.shutdown();
      
      // Shutdown infrastructure
      await this.storageManager.shutdown();
      this.resourceManager.shutdown();
      await this.gpuManager.shutdown();

      this.emit('shutdown');
      this.logger.info('system', 'Codex-Synaptic System shutdown complete');
      
    } catch (error) {
      this.logger.error('system', 'Error during shutdown', undefined, error as Error);
      throw error;
    } finally {
      this.agentRegistry.off('taskAssigned', this.onTaskAssigned);
      this.taskScheduler.off('taskCompleted', this.onTaskCompletedListener);
      this.taskScheduler.off('taskFailed', this.onTaskFailedListener);
      this.clearTaskPromises();
      await this.logger.close();
    }
  }

  async primeCodexInterface(context: CodexContext, envelope: CodexPromptEnvelope): Promise<void> {
    const username = process.env.CODEX_CLI_USERNAME ?? 'admin';
    const password = process.env.CODEX_CLI_PASSWORD ?? 'admin123!';

    try {
      await this.authManager.authenticate(username, password);
    } catch (error) {
      this.logger.warn('system', 'Codex CLI authentication failed', {
        username,
        contextHash: context.contextHash
      }, error as Error);
      throw new CodexSynapticError(
        ErrorCode.AGENT_NOT_FOUND,
        'Codex CLI authentication failed',
        { username, contextHash: context.contextHash },
        true
      );
    }

    this.codexSession = {
      context: cloneCodexContext(context),
      envelope: cloneCodexEnvelope(envelope),
      primedAt: new Date()
    };

    this.logger.info('system', 'Codex CLI primed with context', {
      contextHash: context.contextHash,
      directivesChars: context.agentDirectives.length,
      directories: context.directoryInventory.roots.length,
      databases: context.databaseMetadata.length
    });
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

    this.agentRegistry.on('taskAssigned', this.onTaskAssigned);

    // Task Scheduler Events
    this.taskScheduler.on('taskCompleted', this.onTaskCompletedListener);
    this.taskScheduler.on('taskFailed', this.onTaskFailedListener);

    // GPU Events
    this.gpuManager.on('statusChanged', (status: GPUStatus) => {
      this.resourceManager.setGpuStatus(status);
      this.emit('gpuStatusChanged', status);
    });

    // Neural Mesh Events
    this.neuralMesh.on('topologyUpdated', (topology) => {
      this.logger.info('system', 'Neural mesh topology updated');
      this.emit('topologyUpdated', topology);
    });

    // Consensus Events
    this.consensusManager.on('consensusReached', (result) => {
      const proposalId = result?.proposal?.id ?? 'unknown';
      this.logger.info('system', 'Consensus reached', { proposalId, accepted: result?.accepted });
      this.emit('consensusReached', result);
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

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getAuthenticationManager(): AuthenticationManager {
    return this.authManager;
  }

  getAuthMiddleware(): AuthMiddleware {
    return this.authMiddleware;
  }

  getResourceManager(): ResourceManager {
    return this.resourceManager;
  }

  getGpuManager(): GPUManager {
    return this.gpuManager;
  }

  getAutoScaler(): AutoScaler {
    return this.autoScaler;
  }

  getStorageManager(): StorageManager {
    return this.storageManager;
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
        a2aBridge: this.a2aBridge.getStatus(),
        resources: this.resourceManager.getCurrentUsage(),
        gpu: this.gpuManager.getStatus()
      }
    };
  }

  async deployAgent(type: AgentType, count: number): Promise<void> {
    if (!this.isInitialized) {
      throw new SystemError('System must be initialized before deploying agents.');
    }

    // Check resource availability
    const resourceCheck = this.resourceManager.checkResourceAvailability();
    if (!resourceCheck.available) {
      this.logger.warn('system', 'Resources not available for agent deployment', { reasons: resourceCheck.reasons });
      throw new SystemError(`Cannot deploy agents: ${resourceCheck.reasons.join(', ')}`);
    }

    const maxAgents = this.config?.system.maxAgents ?? Number.MAX_SAFE_INTEGER;
    const currentAgents = this.agentRegistry.getAgentCount();
    const availableSlots = Math.max(maxAgents - currentAgents, 0);

    if (availableSlots === 0) {
      this.logger.warn('system', 'Maximum agent capacity reached; skipping deployment.');
      return;
    }

    const deployCount = Math.min(count, availableSlots);
    const deployedAgents: Agent[] = [];

    for (let i = 0; i < deployCount; i++) {
      const agent = this.createAgentInstance(type);
      deployedAgents.push(agent);
      this.agentRegistry.register(agent);
      this.agentRegistry.updateAgentStatus(agent.getId(), AgentStatus.IDLE);
      this.agentRegistry.reportHeartbeat(agent.getId());
    }

    // Update resource tracking
    this.resourceManager.updateAgentCount(this.agentRegistry.getAgentCount());

    if (deployCount < count) {
      this.logger.warn('system', 'Deployment truncated due to capacity limits', {
        requested: count,
        deployed: deployCount
      });
    }

    this.logger.info('system', 'Agents deployed successfully', {
      type,
      count: deployCount
    });
  }

  async createNeuralMesh(topology: string, nodes: number): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('System must be initialized before configuring the neural mesh.');
    }

    this.logger.info('system', 'Configuring neural mesh', { topology, nodes });
    this.neuralMesh.configure({ topology, desiredNodeCount: nodes });
    this.logger.info('system', 'Neural mesh configuration applied');
  }

  async startSwarm(algorithm: string, objectives: string[] = []): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('System must be initialized before starting swarm coordination.');
    }

    const config: SwarmConfiguration = {
      algorithm: (algorithm as SwarmConfiguration['algorithm']) ||
        (this.config?.swarm.defaultAlgorithm ?? 'pso'),
      parameters: {
        inertiaWeight: 0.6,
        cognitiveCoeff: 1.8,
        socialCoeff: 1.8,
        maxIterations: this.config?.swarm.maxIterations ?? 250
      },
      objectives: objectives.length ? objectives : ['latency', 'throughput', 'resilience'],
      constraints: []
    };

    this.logger.info('system', 'Starting swarm coordination', config);
    this.swarmCoordinator.startSwarm(config);
    this.logger.info('system', 'Swarm coordination in progress');
  }

  async executeTask(prompt: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('System must be initialized before executing tasks.');
    }

    this.logger.info('system', 'Executing workflow for prompt', { prompt });

    const context: WorkflowContext = {
      prompt,
      stageResults: {}
    };

    const stages = this.buildWorkflow(prompt);
    const stageOutputs: Array<{ stage: string; taskId: string; result: any }> = [];

    for (const stage of stages) {
      const payload = stage.payloadBuilder(context);
      const task = this.taskScheduler.submitTask({
        type: stage.taskType,
        priority: stage.priority,
        requiredCapabilities: stage.requiredCapabilities,
        payload
      });

      const stageMeta = {
        id: stage.id,
        label: stage.label,
        taskId: task.id,
        taskType: stage.taskType
      };
      this.emit('workflowStageStarted', {
        ...stageMeta,
        payload
      });

      try {
        const result = await this.waitForTaskResult(task.id);
        context.stageResults[stage.id] = { payload, result };
        stageOutputs.push({ stage: stage.label, taskId: task.id, result });
        this.emit('workflowStageCompleted', {
          ...stageMeta,
          result
        });
      } catch (error) {
        const err = error as Error;
        this.emit('workflowStageFailed', {
          ...stageMeta,
          error: err?.message || err
        });
        throw error;
      }
    }

    const outcome = this.buildWorkflowOutcome(prompt, context, stageOutputs);
    this.logger.info('system', 'Workflow completed', { summary: outcome.summary });
    return outcome;
  }

  async proposeConsensus(type: string, data: any, proposer?: AgentId): Promise<string> {
    const agent = proposer ?? this.agentRegistry.getAgentsByType(AgentType.CONSENSUS_COORDINATOR)[0]?.id;
    if (!agent) {
      throw new Error('No consensus coordinator agent is available to propose consensus.');
    }
    const proposalId = this.consensusManager.proposeConsensus(type, data, agent);
    return proposalId;
  }

  submitConsensusVote(proposalId: string, vote: boolean, voter?: AgentId): void {
    const agent = voter ?? this.agentRegistry.getAgentsByType(AgentType.CONSENSUS_COORDINATOR)[0]?.id;
    if (!agent) {
      throw new Error('No consensus coordinator agent is available to submit a vote.');
    }
    this.consensusManager.submitVote(proposalId, agent, vote, `${agent.id}-sig`);
  }

  async connectMcpEndpoint(endpoint: string): Promise<void> {
    await this.mcpBridge.connectEndpoint(endpoint);
  }

  async sendMcpMessage(endpoint: string, message: any): Promise<any> {
    return this.mcpBridge.sendMessage(endpoint, message);
  }

  async sendA2AMessage(targetId: string | AgentId, message: any, fromAgent?: AgentId): Promise<void> {
    const sender = fromAgent ?? this.agentRegistry.getAgentsByType(AgentType.A2A_BRIDGE)[0]?.id;
    if (!sender) {
      throw new Error('No A2A bridge agent is available to send messages.');
    }

    const recipient = typeof targetId === 'string'
      ? this.agentRegistry.getAgentByStringId(targetId)?.id
      : targetId;

    if (!recipient) {
      throw new Error(`Target agent ${typeof targetId === 'string' ? targetId : targetId.id} not found.`);
    }

    await this.a2aBridge.sendMessage(sender, recipient, message);
  }

  private applyLoggerSettings(): void {
    if (!this.config) return;
    const configuredLevel = (this.config.system.logLevel || 'info').toUpperCase() as keyof typeof LogLevel;
    if (Object.prototype.hasOwnProperty.call(LogLevel, configuredLevel)) {
      const value = LogLevel[configuredLevel];
      if (typeof value === 'number') {
        this.logger.setLogLevel(value as LogLevel);
      }
    }
  }

  private async connectConfiguredBridges(): Promise<void> {
    const endpoints = this.config?.bridges?.mcp?.enabled
      ? this.config?.bridges?.mcp?.endpoints ?? []
      : [];

    for (const endpoint of endpoints) {
      await this.mcpBridge.connectEndpoint(endpoint);
    }
  }

  private async bootstrapDefaultAgents(): Promise<void> {
    const defaults: Array<{ type: AgentType; count: number }> = [
      { type: AgentType.CODE_WORKER, count: 2 },
      { type: AgentType.DATA_WORKER, count: 1 },
      { type: AgentType.VALIDATION_WORKER, count: 1 },
      { type: AgentType.SWARM_COORDINATOR, count: 1 },
      { type: AgentType.TOPOLOGY_COORDINATOR, count: 1 },
      { type: AgentType.CONSENSUS_COORDINATOR, count: 1 },
      { type: AgentType.MCP_BRIDGE, count: 1 },
      { type: AgentType.A2A_BRIDGE, count: 1 }
    ];

    for (const entry of defaults) {
      const existing = this.agentRegistry.getAgentCountByType(entry.type);
      const missing = Math.max(entry.count - existing, 0);
      if (missing > 0) {
        await this.deployAgent(entry.type, missing);
      }
    }
  }

  private createAgentInstance(type: AgentType): Agent {
    switch (type) {
      case AgentType.CODE_WORKER:
        return new CodeWorker();
      case AgentType.DATA_WORKER:
        return new DataWorker();
      case AgentType.VALIDATION_WORKER:
        return new ValidationWorker();
      case AgentType.SWARM_COORDINATOR:
        return new SwarmCoordinatorAgent();
      case AgentType.TOPOLOGY_COORDINATOR:
        return new TopologyCoordinator();
      case AgentType.CONSENSUS_COORDINATOR:
        return new ConsensusCoordinator();
      case AgentType.MCP_BRIDGE:
        return new MCPBridgeAgent(this.mcpBridge);
      case AgentType.A2A_BRIDGE:
        return new A2ABridgeAgent(this.a2aBridge, this.agentRegistry);
      default:
        throw new Error(`Unsupported agent type: ${type}`);
    }
  }

  private async handleTaskAssignment(agentId: AgentId, task: Task): Promise<void> {
    const agent = this.agentRegistry.getAgentInstance(agentId);
    if (!agent) {
      throw new Error(`Agent instance not found for ${agentId.id}`);
    }

    this.agentRegistry.updateAgentStatus(agentId, AgentStatus.RUNNING);

    try {
      const result = await agent.executeTask(task);
      this.taskScheduler.completeTask(task.id, result);
    } catch (error) {
      this.taskScheduler.failTask(task.id, (error as Error).message || 'Agent execution failed');
      throw error;
    }
  }

  private waitForTaskResult(taskId: string): Promise<any> {
    const timeoutMs = this.config?.system.taskTimeout ?? 300000;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.taskPromises.has(taskId)) {
          this.taskPromises.delete(taskId);
          const err = new Error(`Task ${taskId} timed out after ${timeoutMs}ms`);
          this.taskScheduler.failTask(taskId, err.message);
          reject(err);
        }
      }, timeoutMs);

      this.taskPromises.set(taskId, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timeout
      });
    });
  }

  private resolveTaskPromise(taskId: string, result: any): void {
    const tracker = this.taskPromises.get(taskId);
    if (!tracker) return;
    if (tracker.timeout) {
      clearTimeout(tracker.timeout);
    }
    tracker.resolve(result);
    this.taskPromises.delete(taskId);
  }

  private rejectTaskPromise(taskId: string, reason: any): void {
    const tracker = this.taskPromises.get(taskId);
    if (!tracker) return;
    if (tracker.timeout) {
      clearTimeout(tracker.timeout);
    }
    const error = reason instanceof Error ? reason : new Error(String(reason));
    tracker.reject(error);
    this.taskPromises.delete(taskId);
  }

  private clearTaskPromises(): void {
    for (const tracker of this.taskPromises.values()) {
      if (tracker.timeout) {
        clearTimeout(tracker.timeout);
      }
      tracker.reject(new Error('System shutting down'));
    }
    this.taskPromises.clear();
  }

  private buildWorkflow(prompt: string): WorkflowStage[] {
    const lower = prompt.toLowerCase();
    const stages: WorkflowStage[] = [];

    const requiresDataAnalysis = /(analy|metric|data|stat|insight|learn)/.test(lower);
    const requiresCode = /(code|build|implement|function|api|service|module|component)/.test(lower);

    if (requiresDataAnalysis) {
      stages.push({
        id: 'data-analysis',
        label: 'Requirement Analysis',
        taskType: 'data_analysis',
        requiredCapabilities: ['analyze_data'],
        priority: 10,
        payloadBuilder: (ctx) => ({
          data: ctx.prompt.split(/[\.;\n]/).map((item) => item.trim()).filter(Boolean),
          objective: 'Extract actionable insights and requirements'
        })
      });
    }

    if (requiresCode) {
      stages.push({
        id: 'code-generation',
        label: 'Code Generation',
        taskType: 'code_generation',
        requiredCapabilities: ['generate_code'],
        priority: 8,
        payloadBuilder: (ctx) => ({
          description: ctx.prompt,
          language: 'typescript'
        })
      });

      stages.push({
        id: 'code-lint',
        label: 'Code Quality Pass',
        taskType: 'code_lint',
        requiredCapabilities: ['lint_code'],
        priority: 6,
        payloadBuilder: (ctx) => ({
          code: ctx.stageResults['code-generation']?.result?.generatedCode || ''
        })
      });

      stages.push({
        id: 'validation',
        label: 'Validation & Quality Gate',
        taskType: 'validate_code',
        requiredCapabilities: ['validate_code'],
        priority: 5,
        payloadBuilder: (ctx) => ({
          code: ctx.stageResults['code-generation']?.result?.generatedCode || '',
          rules: ['no-console', 'prefer-async', 'document-public-apis']
        })
      });
    }

    stages.push({
      id: 'insight-summary',
      label: 'Insight Synthesis',
      taskType: 'data_summary',
      requiredCapabilities: ['summarize_data'],
      priority: 4,
      payloadBuilder: (ctx) => ({
        data: {
          prompt: ctx.prompt,
          analysis: ctx.stageResults['data-analysis']?.result ?? null,
          code: ctx.stageResults['code-generation']?.result ?? null,
          validation: ctx.stageResults['validation']?.result ?? null
        },
        objective: 'Produce executive summary'
      })
    });

    if (stages.length === 0) {
      stages.push({
        id: 'baseline-analysis',
        label: 'Baseline Analysis',
        taskType: 'data_analysis',
        requiredCapabilities: ['analyze_data'],
        priority: 5,
        payloadBuilder: (ctx) => ({
          data: ctx.prompt,
          objective: 'General understanding'
        })
      });
    }

    return stages;
  }

  private buildWorkflowOutcome(
    prompt: string,
    context: WorkflowContext,
    stageOutputs: Array<{ stage: string; taskId: string; result: any }>
  ): any {
    const code = context.stageResults['code-generation']?.result?.generatedCode ?? null;
    const lintIssues = context.stageResults['code-lint']?.result?.issues ?? [];
    const validation = context.stageResults['validation']?.result ?? null;
    const insight = context.stageResults['insight-summary']?.result ?? null;

    const summaryParts: string[] = [];
    if (code) summaryParts.push('Generated implementation scaffold.');
    if (lintIssues.length === 0) summaryParts.push('Code lint checks passed.');
    if (validation?.passed) summaryParts.push('Validation gates satisfied.');
    if (insight?.summary) summaryParts.push(insight.summary);

    if (summaryParts.length === 0) {
      summaryParts.push('Workflow executed with available agents.');
    }

    return {
      prompt,
      summary: summaryParts.join(' '),
      stages: stageOutputs,
      artifacts: {
        code,
        lintIssues,
        validation,
        insight
      },
      mesh: this.neuralMesh.getStatus(),
      swarm: this.swarmCoordinator.getStatus(),
      consensus: this.consensusManager.getStatus()
    };
  }
}
