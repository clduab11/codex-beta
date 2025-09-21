import { describe, expect, it, vi } from 'vitest';
import { HealthMonitor } from '../../src/core/health';
import { MemoryStatus, ResourceUsage } from '../../src/core/resources';
import { CodexSynapticSystem } from '../../src/core/system';

const createResourceManagerStub = (memoryStatus: MemoryStatus) => ({
  getLimits: () => ({
    maxMemoryMB: memoryStatus.limitMB,
    maxCpuPercent: 80,
    maxActiveAgents: 10,
    maxConcurrentTasks: 10,
    maxRequestsPerMinute: 1000
  }),
  getCurrentUsage: () => ({
    memoryMB: memoryStatus.usageMB,
    cpuPercent: 10,
    activeAgents: 1,
    concurrentTasks: 0,
    requestsPerMinute: 0,
    storageMB: 0,
    memoryStatus,
    rawMemory: {
      rss: Math.round(memoryStatus.rssMB * 1024 * 1024),
      heapTotal: Math.round(memoryStatus.heapTotalMB * 1024 * 1024),
      heapUsed: Math.round(memoryStatus.heapUsedMB * 1024 * 1024),
      external: Math.round(memoryStatus.externalMB * 1024 * 1024),
      arrayBuffers: Math.round(memoryStatus.arrayBuffersMB * 1024 * 1024)
    }
  } as ResourceUsage)
});

const createComponentStub = (status: any) => ({
  getStatus: () => status
});

describe('HealthMonitor memory checks', () => {
  it('reports critical status using resource manager RSS metrics', async () => {
    const memoryStatus: MemoryStatus = {
      state: 'critical',
      usageMB: 2100,
      limitMB: 2048,
      headroomMB: -52,
      rssMB: 2100,
      heapUsedMB: 1500,
      heapTotalMB: 1600,
      externalMB: 100,
      arrayBuffersMB: 10,
      sampledAt: new Date()
    };

    const fakeSystem = {
      getStatus: () => ({ initialized: true, shuttingDown: false }),
      getResourceManager: () => createResourceManagerStub(memoryStatus),
      getAgentRegistry: () => createComponentStub({
        isRunning: true,
        totalAgents: 1,
        statusCounts: {},
        typeCounts: {},
        availableAgents: 1
      }),
      getTaskScheduler: () => createComponentStub({
        pendingTasks: 0,
        runningTasks: 0,
        completedTasks: 0
      }),
      getNeuralMesh: () => createComponentStub({
        isRunning: true,
        nodeCount: 0,
        connectionCount: 0,
        averageConnections: 0,
        topology: 'mesh',
        runActive: true,
        maxRunDurationMs: 3600000,
        remainingTimeMs: 1000
      }),
      getSwarmCoordinator: () => createComponentStub({
        isRunning: true,
        algorithm: 'pso',
        particleCount: 0,
        isOptimizing: true,
        maxRunDurationMs: 3600000,
        remainingTimeMs: 1000
      }),
      getConsensusManager: () => createComponentStub({ isRunning: true, activeProposals: 0, totalVotes: 0 }),
      getMCPBridge: () => createComponentStub({ isRunning: true, connectedEndpoints: [] }),
      getA2ABridge: () => createComponentStub({ isRunning: true, registeredAgents: 0 })
    } as unknown as CodexSynapticSystem;

    const monitor = new HealthMonitor(fakeSystem);
    const health = await monitor.getHealthStatus();

    const memoryCheck = health.checks.find((check) => check.name === 'memory-usage');
    expect(memoryCheck?.status).toBe('fail');
    expect(memoryCheck?.message).toContain('Critical memory usage');
    expect(memoryCheck?.details?.memoryStatus).toBe(memoryStatus);

    expect(health.metrics.system.memoryStatus).toBe(memoryStatus);
    expect(health.metrics.system.memoryUsage.rss).toBe(Math.round(memoryStatus.rssMB * 1024 * 1024));
  });

  it('prevents duplicate interval registration', () => {
    const memoryStatus: MemoryStatus = {
      state: 'normal',
      usageMB: 512,
      limitMB: 2048,
      headroomMB: 1536,
      rssMB: 512,
      heapUsedMB: 256,
      heapTotalMB: 512,
      externalMB: 32,
      arrayBuffersMB: 16,
      sampledAt: new Date()
    };

    const fakeSystem = {
      getStatus: () => ({ initialized: true, shuttingDown: false }),
      getResourceManager: () => createResourceManagerStub(memoryStatus),
      getAgentRegistry: () => createComponentStub({ isRunning: true, totalAgents: 0, statusCounts: {}, typeCounts: {}, availableAgents: 0 }),
      getTaskScheduler: () => createComponentStub({ pendingTasks: 0, runningTasks: 0, completedTasks: 0 }),
      getNeuralMesh: () => createComponentStub({ isRunning: true, nodeCount: 0, connectionCount: 0, averageConnections: 0, topology: 'mesh', runActive: true, maxRunDurationMs: 3600000, remainingTimeMs: 1000 }),
      getSwarmCoordinator: () => createComponentStub({ isRunning: true, algorithm: 'pso', particleCount: 0, isOptimizing: true, maxRunDurationMs: 3600000, remainingTimeMs: 1000 }),
      getConsensusManager: () => createComponentStub({ isRunning: true, activeProposals: 0, totalVotes: 0 }),
      getMCPBridge: () => createComponentStub({ isRunning: true, connectedEndpoints: [] }),
      getA2ABridge: () => createComponentStub({ isRunning: true, registeredAgents: 0 })
    } as unknown as CodexSynapticSystem;

    const monitor = new HealthMonitor(fakeSystem);
    const logger = (monitor as any).logger;
    const warnSpy = vi.spyOn(logger, 'warn');

    monitor.startPeriodicHealthChecks(1000);
    monitor.startPeriodicHealthChecks(1000);
    monitor.stopPeriodicHealthChecks();

    expect(warnSpy).toHaveBeenCalledWith('health', 'Periodic health checks already running');
  });
});
