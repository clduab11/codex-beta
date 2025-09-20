import { Logger } from '../core/logger';
import {
  AgentCapability,
  AgentId,
  AgentStatus,
  AgentType,
  Task
} from '../core/types';
import { A2ABridge } from '../bridging/a2a-bridge';
import { AgentRegistry } from './registry';
import { Agent } from './agent';

const CAPABILITIES: AgentCapability[] = [
  {
    name: 'bridge_message',
    version: '1.0.0',
    description: 'Relay agent-to-agent protocol messages',
    parameters: { routing: ['direct', 'broadcast'] }
  }
];

export class A2ABridgeAgent extends Agent {
  private readonly logger = Logger.getInstance();

  constructor(
    private readonly bridge: A2ABridge,
    private readonly registry: AgentRegistry
  ) {
    super(AgentType.A2A_BRIDGE);
    this.metadata.resources = {
      ...this.metadata.resources,
      cpu: 1,
      memory: 160
    };
    this.setStatus(AgentStatus.IDLE);
  }

  getCapabilities(): AgentCapability[] {
    return CAPABILITIES;
  }

  async executeTask(task: Task): Promise<unknown> {
    this.logger.debug('a2a-bridge-agent', 'Executing task', { taskId: task.id, type: task.type });

    if (task.type !== 'bridge_message') {
      return { status: 'ignored', reason: `Unsupported task type ${task.type}` };
    }

    const fromId = this.resolveAgent(task.payload?.from ?? this.getId().id);
    const toId = this.resolveAgent(task.payload?.to);
    if (!fromId || !toId) {
      return { status: 'failed', reason: 'Invalid source or target agent' };
    }

    await this.bridge.sendMessage(fromId, toId, task.payload?.message ?? {});
    return { status: 'forwarded', from: fromId.id, to: toId.id };
  }

  private resolveAgent(candidate: unknown): AgentId | undefined {
    if (!candidate) return undefined;

    if (typeof candidate === 'string') {
      return this.registry.getAgentByStringId(candidate)?.id;
    }

    if (typeof candidate === 'object') {
      const maybe = candidate as Partial<AgentId>;
      if (typeof maybe.id === 'string' && maybe.type) {
        return this.registry.getAgentByStringId(maybe.id)?.id ?? (maybe as AgentId);
      }
    }

    return undefined;
  }
}
