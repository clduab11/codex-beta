/**
 * Agent registry for managing all agents in the system
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/logger';
import { AgentId, AgentMetadata, AgentStatus, Task, AgentType } from '../core/types';

export class AgentRegistry extends EventEmitter {
  private logger = Logger.getInstance();
  private agents: Map<string, AgentMetadata> = new Map();
  private agentsByType: Map<AgentType, Set<string>> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;
  private isRunning = false;

  constructor() {
    super();
    this.logger.info('registry', 'Agent registry created');
    
    // Initialize agent type maps
    for (const agentType of Object.values(AgentType)) {
      this.agentsByType.set(agentType, new Set());
    }
  }

  async initialize(): Promise<void> {
    this.logger.info('registry', 'Initializing agent registry...');
    
    this.isRunning = true;
    
    // Start heartbeat monitoring
    this.heartbeatInterval = setInterval(() => {
      this.checkAgentHeartbeats();
    }, 30000); // Check every 30 seconds

    this.logger.info('registry', 'Agent registry initialized');
  }

  async shutdown(): Promise<void> {
    this.logger.info('registry', 'Shutting down agent registry...');
    
    this.isRunning = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    // Notify all agents of shutdown
    for (const agent of this.agents.values()) {
      this.emit('systemShutdown', agent.id);
    }

    this.logger.info('registry', 'Agent registry shutdown complete');
  }

  registerAgent(metadata: AgentMetadata): void {
    const agentId = metadata.id.id;
    
    if (this.agents.has(agentId)) {
      this.logger.warn('registry', 'Agent already registered', { agentId });
      return;
    }

    // Add to main registry
    this.agents.set(agentId, metadata);
    
    // Add to type-specific registry
    const typeSet = this.agentsByType.get(metadata.id.type);
    if (typeSet) {
      typeSet.add(agentId);
    }

    this.logger.info('registry', 'Agent registered', { 
      agentId, 
      type: metadata.id.type,
      capabilities: metadata.capabilities.map(c => c.name)
    });
    
    this.emit('agentRegistered', metadata);
  }

  unregisterAgent(agentId: AgentId): void {
    const agent = this.agents.get(agentId.id);
    if (!agent) {
      this.logger.warn('registry', 'Attempted to unregister non-existent agent', { agentId: agentId.id });
      return;
    }

    // Remove from main registry
    this.agents.delete(agentId.id);
    
    // Remove from type-specific registry
    const typeSet = this.agentsByType.get(agent.id.type);
    if (typeSet) {
      typeSet.delete(agentId.id);
    }

    this.logger.info('registry', 'Agent unregistered', { agentId: agentId.id });
    this.emit('agentUnregistered', agentId);
  }

  updateAgentStatus(agentId: AgentId, status: AgentStatus): void {
    const agent = this.agents.get(agentId.id);
    if (!agent) {
      this.logger.warn('registry', 'Attempted to update status of non-existent agent', { agentId: agentId.id });
      return;
    }

    const oldStatus = agent.status;
    agent.status = status;
    agent.lastUpdated = new Date();

    this.logger.debug('registry', 'Agent status updated', { 
      agentId: agentId.id, 
      oldStatus, 
      newStatus: status 
    });
    
    this.emit('agentStatusChanged', agentId, status, oldStatus);
  }

  getAgent(agentId: AgentId): AgentMetadata | undefined {
    return this.agents.get(agentId.id);
  }

  getAgentsByType(agentType: AgentType): AgentMetadata[] {
    const typeSet = this.agentsByType.get(agentType);
    if (!typeSet) return [];

    return Array.from(typeSet)
      .map(agentId => this.agents.get(agentId))
      .filter((agent): agent is AgentMetadata => agent !== undefined);
  }

  getAvailableAgents(): AgentId[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.status === AgentStatus.IDLE || agent.status === AgentStatus.RUNNING)
      .map(agent => agent.id);
  }

  getAgentsWithCapability(capability: string): AgentMetadata[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.capabilities.some(cap => cap.name === capability)
    );
  }

  async assignTask(agentId: AgentId, task: Task): Promise<void> {
    const agent = this.agents.get(agentId.id);
    if (!agent) {
      throw new Error(`Agent ${agentId.id} not found`);
    }

    if (agent.status !== AgentStatus.IDLE && agent.status !== AgentStatus.RUNNING) {
      throw new Error(`Agent ${agentId.id} is not available (status: ${agent.status})`);
    }

    // Update agent status
    this.updateAgentStatus(agentId, AgentStatus.BUSY);

    this.logger.info('registry', 'Task assigned to agent', { 
      agentId: agentId.id, 
      taskId: task.id 
    });

    // This would trigger actual communication with the agent
    this.emit('taskAssigned', agentId, task);
  }

  reportHeartbeat(agentId: AgentId, data?: any): void {
    const agent = this.agents.get(agentId.id);
    if (!agent) {
      this.logger.warn('registry', 'Heartbeat from unknown agent', { agentId: agentId.id });
      return;
    }

    agent.lastUpdated = new Date();
    
    this.logger.debug('registry', 'Heartbeat received', { 
      agentId: agentId.id, 
      data 
    });
    
    this.emit('heartbeat', agentId, data);
  }

  private checkAgentHeartbeats(): void {
    if (!this.isRunning) return;

    const now = new Date();
    const heartbeatTimeout = 90000; // 90 seconds

    for (const agent of this.agents.values()) {
      const timeSinceLastUpdate = now.getTime() - agent.lastUpdated.getTime();
      
      if (timeSinceLastUpdate > heartbeatTimeout) {
        if (agent.status !== AgentStatus.OFFLINE) {
          this.logger.warn('registry', 'Agent missed heartbeat, marking as offline', { 
            agentId: agent.id.id,
            timeSinceLastUpdate: Math.floor(timeSinceLastUpdate / 1000) + 's'
          });
          
          this.updateAgentStatus(agent.id, AgentStatus.OFFLINE);
        }
      }
    }
  }

  getAllAgents(): AgentMetadata[] {
    return Array.from(this.agents.values());
  }

  getAgentCount(): number {
    return this.agents.size;
  }

  getAgentCountByType(agentType: AgentType): number {
    return this.agentsByType.get(agentType)?.size || 0;
  }

  getAgentCountByStatus(status: AgentStatus): number {
    return Array.from(this.agents.values()).filter(agent => agent.status === status).length;
  }

  getStatus(): any {
    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    for (const status of Object.values(AgentStatus)) {
      statusCounts[status] = this.getAgentCountByStatus(status);
    }

    for (const agentType of Object.values(AgentType)) {
      typeCounts[agentType] = this.getAgentCountByType(agentType);
    }

    return {
      isRunning: this.isRunning,
      totalAgents: this.getAgentCount(),
      statusCounts,
      typeCounts,
      availableAgents: this.getAvailableAgents().length
    };
  }
}