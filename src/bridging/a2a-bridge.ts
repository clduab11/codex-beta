/**
 * A2A (Agent-to-Agent) Bridge for direct agent communication
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/logger';
import { AgentRegistry } from '../agents/registry';

export class A2ABridge extends EventEmitter {
  private logger = Logger.getInstance();
  private isRunning = false;

  constructor(private agentRegistry: AgentRegistry) {
    super();
    this.logger.info('a2a-bridge', 'A2A bridge created');
  }

  async initialize(): Promise<void> {
    this.logger.info('a2a-bridge', 'Initializing A2A bridge...');
    this.isRunning = true;
    this.logger.info('a2a-bridge', 'A2A bridge initialized');
  }

  async shutdown(): Promise<void> {
    this.logger.info('a2a-bridge', 'Shutting down A2A bridge...');
    this.isRunning = false;
    this.logger.info('a2a-bridge', 'A2A bridge shutdown complete');
  }

  getStatus(): any {
    return {
      isRunning: this.isRunning,
      registeredAgents: this.agentRegistry.getAgentCount()
    };
  }
}