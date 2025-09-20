import { CodexSynapticSystem } from '../core/system';
import { Logger } from '../core/logger';
import { AgentRegistry } from '../agents/registry';
import { Task } from '../core/types';
import { ResourceUsage } from '../core/resources';

interface ProcessListener {
  signal: NodeJS.Signals | 'beforeExit';
  handler: () => void;
}

interface AgentSnapshot {
  total: number;
  available: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

interface TaskRecord {
  id: string;
  status: 'completed' | 'failed';
  summary?: string;
  timestamp: string;
}

export interface CliTelemetrySnapshot {
  agents: AgentSnapshot;
  resources?: ResourceUsage;
  mesh?: any;
  swarm?: any;
  consensus?: any;
  recentTasks: TaskRecord[];
}

/**
 * Centralizes lifecycle management for a single CodexSynapticSystem per CLI process.
 * Ensures clean startup/shutdown semantics, hooks process signals, and collects
 * lightweight telemetry for interactive commands without leaking globals.
 */
export class CliSession {
  private static instance: CliSession;

  static getInstance(): CliSession {
    if (!CliSession.instance) {
      CliSession.instance = new CliSession();
    }
    return CliSession.instance;
  }

  private readonly logger = Logger.getInstance();
  private system?: CodexSynapticSystem;
  private startPromise?: Promise<CodexSynapticSystem>;
  private processListeners: ProcessListener[] = [];
  private cleanupFns: Array<() => void> = [];
  private shuttingDown = false;
  private initLock: Promise<void> | null = null;
  private releaseInitLock?: () => void;

  private telemetry: CliTelemetrySnapshot = {
    agents: {
      total: 0,
      available: 0,
      byType: {},
      byStatus: {}
    },
    resources: undefined,
    recentTasks: []
  };

  private constructor() {}

  /**
   * Returns the live system, initializing it on first access.
   */
  async ensureSystem(): Promise<CodexSynapticSystem> {
    if (this.system) {
      return this.system;
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    const release = await this.acquireInitLock();
    try {
      if (this.system) {
        return this.system;
      }

      if (this.startPromise) {
        return this.startPromise;
      }

      const bootPromise = this.bootSystem();
      this.startPromise = bootPromise
        .then((systemInstance) => {
          this.startPromise = undefined;
          return systemInstance;
        })
        .catch((error) => {
          this.startPromise = undefined;
          throw error;
        });

      return await this.startPromise;
    } finally {
      release();
    }
  }

  getSystemUnsafe(): CodexSynapticSystem | undefined {
    return this.system;
  }

  getTelemetry(): CliTelemetrySnapshot {
    const resources = this.telemetry.resources
      ? {
          ...this.telemetry.resources,
          memoryStatus: this.telemetry.resources.memoryStatus
            ? { ...this.telemetry.resources.memoryStatus }
            : undefined,
          rawMemory: this.telemetry.resources.rawMemory
            ? { ...this.telemetry.resources.rawMemory }
            : undefined,
          gpu: this.telemetry.resources.gpu
            ? {
                ...this.telemetry.resources.gpu,
                devices: [...this.telemetry.resources.gpu.devices],
                diagnostics: [...this.telemetry.resources.gpu.diagnostics]
              }
            : undefined
        }
      : undefined;
    return {
      agents: { ...this.telemetry.agents },
      resources,
      mesh: this.telemetry.mesh,
      swarm: this.telemetry.swarm,
      consensus: this.telemetry.consensus,
      recentTasks: [...this.telemetry.recentTasks]
    };
  }

  async shutdown(reason?: string): Promise<void> {
    if (this.shuttingDown) {
      return;
    }

    this.shuttingDown = true;

    if (!this.system) {
      this.deregisterProcessHooks();
      this.shuttingDown = false;
      return;
    }

    try {
      this.logger.info('cli', 'Shutting down Codex-Synaptic session', { reason });
      await this.system.shutdown();
    } catch (error) {
      this.logger.error('cli', 'Error during session shutdown', { reason }, error as Error);
    } finally {
      for (const fn of this.cleanupFns.splice(0)) {
        try {
          fn();
        } catch (cleanupError) {
          this.logger.debug('cli', 'Cleanup handler failed', { error: (cleanupError as Error).message });
        }
      }
      this.telemetry = {
        agents: {
          total: 0,
          available: 0,
          byType: {},
          byStatus: {}
        },
        resources: undefined,
        recentTasks: []
      };
      this.system = undefined;
      this.startPromise = undefined;
      this.deregisterProcessHooks();
      this.shuttingDown = false;
    }
  }

  private async bootSystem(): Promise<CodexSynapticSystem> {
    const system = new CodexSynapticSystem();
    this.logger.info('cli', 'Initializing Codex-Synaptic system for CLI session');
    await system.initialize();
    this.system = system;
    this.refreshAgentTelemetry(system.getAgentRegistry());
    this.attachTelemetry(system);
    this.installProcessHooks();
    return system;
  }

  private attachTelemetry(system: CodexSynapticSystem): void {
    const agentRegistered = () => this.refreshAgentTelemetry(system.getAgentRegistry());
    const agentUnregistered = () => this.refreshAgentTelemetry(system.getAgentRegistry());
    const topologyUpdated = (topology: any) => {
      this.telemetry.mesh = topology;
    };
    const consensusReached = (result: any) => {
      this.telemetry.consensus = result;
    };
    const taskCompleted = (task: Task) => this.recordTask(task, 'completed');
    const taskFailed = (task: Task) => this.recordTask(task, 'failed');
    const resourceManager = system.getResourceManager();
    const resourcesUpdate = (usage: ResourceUsage) => {
      this.telemetry.resources = usage;
    };

    system.on('agentRegistered', agentRegistered);
    system.on('agentUnregistered', agentUnregistered);
    system.on('topologyUpdated', topologyUpdated);
    system.on('consensusReached', consensusReached);
    system.on('taskCompleted', taskCompleted);
    system.on('taskFailed', taskFailed);
    resourceManager.on('resourceUpdate', resourcesUpdate);

    this.cleanupFns.push(() => {
      system.off('agentRegistered', agentRegistered);
      system.off('agentUnregistered', agentUnregistered);
      system.off('topologyUpdated', topologyUpdated);
      system.off('consensusReached', consensusReached);
      system.off('taskCompleted', taskCompleted);
      system.off('taskFailed', taskFailed);
      resourceManager.off('resourceUpdate', resourcesUpdate);
    });

    const swarmCoordinator = system.getSwarmCoordinator();
    const refreshSwarm = () => {
      this.telemetry.swarm = swarmCoordinator.getStatus();
    };
    swarmCoordinator.on('swarmStarted', refreshSwarm);
    swarmCoordinator.on('swarmStopped', refreshSwarm);
    this.cleanupFns.push(() => {
      swarmCoordinator.off('swarmStarted', refreshSwarm);
      swarmCoordinator.off('swarmStopped', refreshSwarm);
    });

    this.telemetry.resources = resourceManager.getCurrentUsage();
  }

  private refreshAgentTelemetry(registry: AgentRegistry): void {
    const status = registry.getStatus();
    this.telemetry.agents = {
      total: status.totalAgents,
      available: status.availableAgents,
      byType: { ...status.typeCounts },
      byStatus: { ...status.statusCounts }
    };
  }

  private recordTask(task: Task, status: 'completed' | 'failed'): void {
    const entry: TaskRecord = {
      id: task.id,
      status,
      summary: status === 'completed' ? task.result?.summary ?? task.type : task.error ?? task.type,
      timestamp: new Date().toISOString()
    };

    this.telemetry.recentTasks = [entry, ...this.telemetry.recentTasks].slice(0, 10);
  }

  private installProcessHooks(): void {
    if (this.processListeners.length > 0) {
      return;
    }

    const terminate = (signal: NodeJS.Signals | 'beforeExit') => {
      this.logger.warn('cli', 'Received termination signal, shutting down', { signal });
      void this.shutdown(signal);
    };

    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      const handler = () => terminate(signal);
      process.once(signal, handler);
      this.processListeners.push({ signal, handler });
    }

    const beforeExitHandler = () => terminate('beforeExit');
    process.once('beforeExit', beforeExitHandler);
    this.processListeners.push({ signal: 'beforeExit', handler: beforeExitHandler });
  }

  private deregisterProcessHooks(): void {
    for (const entry of this.processListeners) {
      process.removeListener(entry.signal, entry.handler);
    }
    this.processListeners = [];
  }

  private async acquireInitLock(): Promise<() => void> {
    while (this.initLock) {
      try {
        await this.initLock;
      } catch {
        // Ignore lock resolution failures and retry acquisition
      }
    }

    let resolveLock!: () => void;
    this.initLock = new Promise<void>((resolve) => {
      resolveLock = () => {
        this.initLock = null;
        resolve();
      };
    });

    this.releaseInitLock = resolveLock;

    return () => {
      if (this.releaseInitLock) {
        const releaseFn = this.releaseInitLock;
        this.releaseInitLock = undefined;
        releaseFn();
      }
    };
  }
}
