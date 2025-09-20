/**
 * Health monitoring and system diagnostics
 */

import { EventEmitter } from 'events';
import { Logger } from './logger';
import { CodexSynapticSystem } from './system';
import { MemoryStatus } from './resources';

export interface HealthMetrics {
  timestamp: Date;
  uptime: number;
  system: {
    initialized: boolean;
    shuttingDown: boolean;
    memoryUsage: NodeJS.MemoryUsage;
    memoryStatus?: MemoryStatus;
    cpuUsage?: NodeJS.CpuUsage;
  };
  agents: {
    total: number;
    active: number;
    idle: number;
    error: number;
    byType: Record<string, number>;
  };
  tasks: {
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
  swarm: {
    active: boolean;
    algorithm?: string;
    particles: number;
    optimizing: boolean;
  };
  mesh: {
    nodes: number;
    connections: number;
    averageConnections: number;
  };
  consensus: {
    activeProposals: number;
    totalVotes: number;
  };
  bridges: {
    mcp: {
      connected: boolean;
      endpoints: number;
    };
    a2a: {
      connected: boolean;
      agents: number;
    };
  };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  metrics: HealthMetrics;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: any;
}

export class HealthMonitor extends EventEmitter {
  private logger = Logger.getInstance();
  private startTime = new Date();
  private lastCpuUsage?: NodeJS.CpuUsage;
  private healthChecks: Map<string, () => Promise<HealthCheck>> = new Map();
  private healthInterval?: NodeJS.Timeout;

  constructor(private system: CodexSynapticSystem) {
    super();
    this.setupDefaultHealthChecks();
    this.logger.info('health', 'Health monitor initialized');
  }

  private setupDefaultHealthChecks(): void {
    // System health checks
    this.addHealthCheck('system-status', async () => {
      const status = this.system.getStatus();
      return {
        name: 'system-status',
        status: status.initialized && !status.shuttingDown ? 'pass' : 'fail',
        message: status.initialized ? 'System operational' : 'System not ready',
        details: status
      };
    });

    // Memory usage check
    this.addHealthCheck('memory-usage', async () => {
      const resourceManager = this.system.getResourceManager();
      const limits = resourceManager.getLimits();
      const usage = resourceManager.getCurrentUsage();
      const memoryStatus = usage.memoryStatus;

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `RSS memory: ${(usage.memoryMB ?? 0).toFixed(1)}MB / ${limits.maxMemoryMB}MB`;

      if (memoryStatus) {
        switch (memoryStatus.state) {
          case 'critical':
            status = 'fail';
            message = `Critical memory usage: ${memoryStatus.usageMB.toFixed(1)}MB / ${memoryStatus.limitMB}MB`;
            break;
          case 'elevated':
            status = 'warn';
            message = `Elevated memory usage: ${memoryStatus.usageMB.toFixed(1)}MB / ${memoryStatus.limitMB}MB`;
            break;
          default:
            status = 'pass';
        }
      }

      return {
        name: 'memory-usage',
        status,
        message,
        details: {
          memoryStatus,
          raw: usage.rawMemory
        }
      };
    });

    // Agent registry health
    this.addHealthCheck('agent-registry', async () => {
      const registry = this.system.getAgentRegistry();
      const registryStatus = registry.getStatus();
      
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `${registryStatus.totalAgents} agents registered`;

      if (!registryStatus.isRunning) {
        status = 'fail';
        message = 'Agent registry not running';
      } else if (registryStatus.totalAgents === 0) {
        status = 'warn';
        message = 'No agents registered';
      }

      return {
        name: 'agent-registry',
        status,
        message,
        details: registryStatus
      };
    });

    // Task scheduler health
    this.addHealthCheck('task-scheduler', async () => {
      const scheduler = this.system.getTaskScheduler();
      const schedulerStatus = scheduler.getStatus();

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `Scheduler running: ${schedulerStatus.pendingTasks} pending, ${schedulerStatus.runningTasks} running`;

      if (!schedulerStatus.isRunning) {
        status = 'fail';
        message = 'Task scheduler not running';
      } else if (schedulerStatus.pendingTasks > 100) {
        status = 'warn';
        message = `High task queue: ${schedulerStatus.pendingTasks} pending tasks`;
      }

      return {
        name: 'task-scheduler',
        status,
        message,
        details: schedulerStatus
      };
    });

    // Neural mesh health
    this.addHealthCheck('neural-mesh', async () => {
      const mesh = this.system.getNeuralMesh();
      const meshStatus = mesh.getStatus();

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `Neural mesh: ${meshStatus.nodeCount} nodes, ${meshStatus.connectionCount} connections`;

      if (!meshStatus.isRunning) {
        status = 'warn';
        message = 'Neural mesh not active';
      } else if (meshStatus.nodeCount === 0) {
        status = 'warn';
        message = 'No nodes in neural mesh';
      }

      return {
        name: 'neural-mesh',
        status,
        message,
        details: meshStatus
      };
    });

    // Swarm coordinator health
    this.addHealthCheck('swarm-coordinator', async () => {
      const swarm = this.system.getSwarmCoordinator();
      const swarmStatus = swarm.getStatus();

      return {
        name: 'swarm-coordinator',
        status: swarmStatus.isRunning ? 'pass' : 'warn',
        message: swarmStatus.isRunning 
          ? `Swarm active: ${swarmStatus.algorithm}, ${swarmStatus.particleCount} particles`
          : 'Swarm not active',
        details: swarmStatus
      };
    });

    // Consensus manager health
    this.addHealthCheck('consensus-manager', async () => {
      const consensus = this.system.getConsensusManager();
      const consensusStatus = consensus.getStatus();

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `Consensus: ${consensusStatus.activeProposals} active proposals`;

      if (!consensusStatus.isRunning) {
        status = 'fail';
        message = 'Consensus manager not running';
      }

      return {
        name: 'consensus-manager',
        status,
        message,
        details: consensusStatus
      };
    });
  }

  addHealthCheck(name: string, check: () => Promise<HealthCheck>): void {
    this.healthChecks.set(name, check);
    this.logger.debug('health', `Health check added: ${name}`);
  }

  removeHealthCheck(name: string): void {
    this.healthChecks.delete(name);
    this.logger.debug('health', `Health check removed: ${name}`);
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const checks: HealthCheck[] = [];
    
    // Run all health checks
    for (const [name, checkFn] of this.healthChecks) {
      try {
        const result = await checkFn();
        checks.push(result);
      } catch (error) {
        checks.push({
          name,
          status: 'fail',
          message: `Health check failed: ${(error as Error).message}`,
          details: error
        });
      }
    }

    // Determine overall status
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warnCount = checks.filter(c => c.status === 'warn').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (failCount > 0) {
      overallStatus = 'unhealthy';
    } else if (warnCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const metrics = await this.getMetrics();

    return {
      status: overallStatus,
      checks,
      metrics
    };
  }

  async getMetrics(): Promise<HealthMetrics> {
    const systemStatus = this.system.getStatus();
    const resourceManager = this.system.getResourceManager();
    const resourceUsage = resourceManager.getCurrentUsage();
    const memoryUsage = resourceUsage.rawMemory ?? process.memoryUsage();
    const memoryStatus = resourceUsage.memoryStatus;
    
    // Calculate CPU usage
    const currentCpuUsage = process.cpuUsage();
    let cpuUsage: NodeJS.CpuUsage | undefined;
    if (this.lastCpuUsage) {
      cpuUsage = process.cpuUsage(this.lastCpuUsage);
    }
    this.lastCpuUsage = currentCpuUsage;

    // Get component statuses
    const agentRegistry = this.system.getAgentRegistry();
    const agentStatus = agentRegistry.getStatus();
    
    const taskScheduler = this.system.getTaskScheduler();
    const taskStatus = taskScheduler.getStatus();
    
    const mesh = this.system.getNeuralMesh();
    const meshStatus = mesh.getStatus();
    
    const swarm = this.system.getSwarmCoordinator();
    const swarmStatus = swarm.getStatus();
    
    const consensus = this.system.getConsensusManager();
    const consensusStatus = consensus.getStatus();
    
    const mcpBridge = this.system.getMCPBridge();
    const mcpStatus = mcpBridge.getStatus();
    
    const a2aBridge = this.system.getA2ABridge();
    const a2aStatus = a2aBridge.getStatus();

    return {
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      system: {
        initialized: systemStatus.initialized,
        shuttingDown: systemStatus.shuttingDown,
        memoryUsage,
        memoryStatus,
        cpuUsage
      },
      agents: {
        total: agentStatus.totalAgents,
        active: agentStatus.statusCounts.running || 0,
        idle: agentStatus.statusCounts.idle || 0,
        error: agentStatus.statusCounts.error || 0,
        byType: agentStatus.typeCounts
      },
      tasks: {
        pending: taskStatus.pendingTasks,
        running: taskStatus.runningTasks,
        completed: taskStatus.completedTasks,
        failed: 0 // This would need to be tracked separately
      },
      swarm: {
        active: swarmStatus.isRunning,
        algorithm: swarmStatus.algorithm,
        particles: swarmStatus.particleCount,
        optimizing: swarmStatus.isOptimizing
      },
      mesh: {
        nodes: meshStatus.nodeCount,
        connections: meshStatus.connectionCount,
        averageConnections: meshStatus.averageConnections
      },
      consensus: {
        activeProposals: consensusStatus.activeProposals,
        totalVotes: consensusStatus.totalVotes
      },
      bridges: {
        mcp: {
          connected: mcpStatus.isRunning,
          endpoints: mcpStatus.connectedEndpoints?.length || 0
        },
        a2a: {
          connected: a2aStatus.isRunning,
          agents: a2aStatus.registeredAgents || 0
        }
      }
    };
  }

  startPeriodicHealthChecks(intervalMs: number = 30000): void {
    if (this.healthInterval) {
      this.logger.warn('health', 'Periodic health checks already running');
      return;
    }

    const checkHealth = async () => {
      try {
        const healthStatus = await this.getHealthStatus();
        this.emit('healthCheck', healthStatus);
        
        // Log unhealthy status
        if (healthStatus.status === 'unhealthy') {
          const failedChecks = healthStatus.checks.filter(c => c.status === 'fail');
          this.logger.warn('health', 'System unhealthy', { 
            failedChecks: failedChecks.map(c => c.name)
          });
        }
      } catch (error) {
        this.logger.error('health', 'Health check failed', undefined, error as Error);
      }
    };

    // Run initial check
    void checkHealth();
    
    // Schedule periodic checks
    this.healthInterval = setInterval(checkHealth, intervalMs);
    
    this.logger.info('health', `Periodic health checks started (${intervalMs}ms interval)`);
  }

  stopPeriodicHealthChecks(): void {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = undefined;
      this.logger.info('health', 'Periodic health checks stopped');
    }
  }
}
