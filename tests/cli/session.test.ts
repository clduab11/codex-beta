import { afterEach, describe, expect, it, vi } from 'vitest';
import { CliSession } from '../../src/cli/session';
import { CodexBetaSystem } from '../../src/core/system';
import { Task, TaskStatus } from '../../src/core/types';

const shutdownSession = async () => {
  const session = CliSession.getInstance();
  await session.shutdown('test-cleanup');
};

describe('CliSession lifecycle', () => {
  afterEach(async () => {
    await shutdownSession();
    vi.restoreAllMocks();
  });

  it('initializes the system once per process', async () => {
    const session = CliSession.getInstance();
    const systemA = await session.ensureSystem();
    const systemB = await session.ensureSystem();

    expect(systemA).toBe(systemB);
  });

  it('captures completed tasks in telemetry history', async () => {
    const session = CliSession.getInstance();
    const system = await session.ensureSystem();

    const task: Task = {
      id: 'telemetry-test-task',
      type: 'unit_test',
      priority: 1,
      requiredCapabilities: [],
      payload: {},
      created: new Date(),
      status: TaskStatus.COMPLETED,
      result: { summary: 'completed in test' }
    };

    system.emit('taskCompleted', task);

    const telemetry = session.getTelemetry();
    expect(telemetry.recentTasks.length).toBeGreaterThan(0);
    expect(telemetry.recentTasks[0]?.id).toBe('telemetry-test-task');
  });

  it('recovers from initialization failure on subsequent ensureSystem call', async () => {
    const session = CliSession.getInstance();

    vi.spyOn(CodexBetaSystem.prototype, 'initialize')
      .mockRejectedValueOnce(new Error('boot failure'))
      .mockResolvedValueOnce(undefined);
    vi.spyOn(CodexBetaSystem.prototype, 'shutdown').mockResolvedValue(undefined);

    await expect(session.ensureSystem()).rejects.toThrow('boot failure');
    expect(session.getSystemUnsafe()).toBeUndefined();

    const system = await session.ensureSystem();
    expect(system).toBeDefined();
    expect(CodexBetaSystem.prototype.initialize).toHaveBeenCalledTimes(2);
  });

  it('serializes concurrent ensureSystem calls into a single initialization', async () => {
    const session = CliSession.getInstance();

    vi.spyOn(CodexBetaSystem.prototype, 'initialize').mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    vi.spyOn(CodexBetaSystem.prototype, 'shutdown').mockResolvedValue(undefined);

    const [first, second] = await Promise.all([session.ensureSystem(), session.ensureSystem()]);

    expect(first).toBe(second);
    expect(CodexBetaSystem.prototype.initialize).toHaveBeenCalledTimes(1);
  });
});
