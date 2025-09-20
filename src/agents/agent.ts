
import {
  AgentId,
  AgentType,
  AgentCapability,
  AgentMetadata,
  AgentStatus,
  Task
} from '../core/types';
import { v4 as uuidv4 } from 'uuid';

export abstract class Agent {
  protected id: AgentId;
  protected metadata: AgentMetadata;
  protected status: AgentStatus;

  constructor(type: AgentType) {
    this.id = {
      id: uuidv4(),
      type,
      version: '1.0.0'
    };
    this.status = AgentStatus.INITIALIZING;
    this.metadata = {
      id: this.id,
      capabilities: this.getCapabilities(),
      resources: {
        cpu: 1,
        memory: 512,
        storage: 1024,
        bandwidth: 10
      },
      networkInfo: {
        address: 'localhost',
        port: 0,
        protocol: 'tcp',
        endpoints: []
      },
      status: this.status,
      created: new Date(),
      lastUpdated: new Date()
    };
    this.status = AgentStatus.IDLE;
  }

  abstract getCapabilities(): AgentCapability[];

  abstract executeTask(task: Task): Promise<any>;

  getId(): AgentId {
    return this.id;
  }

  getMetadata(): AgentMetadata {
    return this.metadata;
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  setStatus(status: AgentStatus): void {
    this.status = status;
    this.metadata.status = status;
    this.metadata.lastUpdated = new Date();
  }

  heartbeat(): void {
    this.metadata.lastUpdated = new Date();
  }
}
