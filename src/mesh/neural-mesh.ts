/**
 * Neural Mesh implementation for interconnected agent networks
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/logger';
import { AgentRegistry } from '../agents/registry';
import { NeuralMeshNode, Connection, AgentId } from '../core/types';

export class NeuralMesh extends EventEmitter {
  private logger = Logger.getInstance();
  private nodes: Map<string, NeuralMeshNode> = new Map();
  private topology: string = 'mesh';
  private updateInterval?: NodeJS.Timeout;
  private isRunning = false;
  private maxConnections = 5;
  private readonly updateIntervalMs = 5000;
  private maxRunDurationMs = 60 * 60 * 1000;
  private runTimeout?: NodeJS.Timeout;
  private runStartedAt?: number;
  private dynamicUpdatesActive = false;

  constructor(private agentRegistry: AgentRegistry) {
    super();
    this.logger.info('neural-mesh', 'Neural mesh created');
  }

  async initialize(): Promise<void> {
    this.logger.info('neural-mesh', 'Initializing neural mesh...');
    
    this.isRunning = true;
    this.activateUpdates('initialize');

    this.setupEventHandlers();
    
    this.logger.info('neural-mesh', 'Neural mesh initialized');
  }

  async shutdown(): Promise<void> {
    this.logger.info('neural-mesh', 'Shutting down neural mesh...');
    
    this.isRunning = false;

    this.stopDynamicUpdates('manual');

    this.nodes.clear();
    
    this.logger.info('neural-mesh', 'Neural mesh shutdown complete');
  }

  configure(options: {
    topology?: string;
    maxConnections?: number;
    desiredNodeCount?: number;
  }): void {
    if (options.topology) {
      this.topology = options.topology;
    }
    if (options.maxConnections) {
      this.maxConnections = Math.max(1, options.maxConnections);
    }

    if (options.desiredNodeCount && options.desiredNodeCount > this.nodes.size) {
      this.logger.debug('neural-mesh', 'Mesh has fewer nodes than desired configuration', {
        desired: options.desiredNodeCount,
        actual: this.nodes.size
      });
    }

    this.rebuildConnections();
    this.activateUpdates('configure');
  }

  private setupEventHandlers(): void {
    this.agentRegistry.on('agentRegistered', (agent: any) => {
      this.addNode(agent.id);
    });

    this.agentRegistry.on('agentUnregistered', (agentId: AgentId) => {
      this.removeNode(agentId);
    });
  }

  private addNode(agentId: AgentId): void {
    if (this.nodes.has(agentId.id)) {
      return;
    }

    const node: NeuralMeshNode = {
      agent: agentId,
      position: this.generateRandomPosition(),
      connections: [],
      state: {},
      lastUpdate: new Date()
    };

    this.nodes.set(agentId.id, node);
    this.rebuildConnections();
    
    this.logger.info('neural-mesh', 'Node added to mesh', { agentId: agentId.id });
    this.emit('nodeAdded', node);
  }

  private removeNode(agentId: AgentId): void {
    const node = this.nodes.get(agentId.id);
    if (!node) return;

    // Remove connections to this node from other nodes
    for (const otherNode of this.nodes.values()) {
      otherNode.connections = otherNode.connections.filter(
        conn => conn.target.id !== agentId.id
      );
    }

    this.nodes.delete(agentId.id);

    this.logger.info('neural-mesh', 'Node removed from mesh', { agentId: agentId.id });
    this.emit('nodeRemoved', agentId);
    this.rebuildConnections();
  }

  private generateRandomPosition(): number[] {
    return [Math.random() * 100, Math.random() * 100, Math.random() * 100];
  }

  private establishConnections(node: NeuralMeshNode): void {
    const allNodes = Array.from(this.nodes.values()).filter(n => n.agent.id !== node.agent.id);
    
    // Connect to nearby nodes (simplified - in reality would use more sophisticated algorithms)
    const nearbyNodes = allNodes
      .sort(() => Math.random() - 0.5) // Random for now
      .slice(0, Math.min(this.maxConnections, allNodes.length));

    for (const targetNode of nearbyNodes) {
      const connection: Connection = {
        target: targetNode.agent,
        weight: Math.random(),
        type: 'async',
        protocol: 'ws',
        lastActivity: new Date()
      };

      node.connections.push(connection);
    }

    this.logger.debug('neural-mesh', 'Connections established', { 
      nodeId: node.agent.id,
      connections: node.connections.length
    });
  }

  private rebuildConnections(): void {
    for (const node of this.nodes.values()) {
      node.connections = [];
    }

    for (const node of this.nodes.values()) {
      this.establishConnections(node);
    }

    this.emit('topologyUpdated', this.getTopology());
  }

  private updateTopology(): void {
    if (!this.isRunning || !this.dynamicUpdatesActive) return;

    // Update node states and connection weights based on activity
    for (const node of this.nodes.values()) {
      node.lastUpdate = new Date();
      
      // Update connection weights based on usage (simplified)
      for (const connection of node.connections) {
        const timeSinceActivity = Date.now() - connection.lastActivity.getTime();
        if (timeSinceActivity > 60000) { // 1 minute
          connection.weight *= 0.95; // Decay unused connections
        }
      }
    }

    this.emit('topologyUpdated', this.getTopology());
  }

  getTopology(): any {
    return {
      nodes: Array.from(this.nodes.values()),
      connections: this.getConnectionCount(),
      averageConnections: this.getAverageConnections()
    };
  }

  private getConnectionCount(): number {
    return Array.from(this.nodes.values()).reduce(
      (total, node) => total + node.connections.length, 0
    );
  }

  private getAverageConnections(): number {
    const nodeCount = this.nodes.size;
    return nodeCount > 0 ? this.getConnectionCount() / nodeCount : 0;
  }

  getNeighbors(agentId: AgentId): NeuralMeshNode[] {
    const node = this.nodes.get(agentId.id);
    if (!node) {
      return [];
    }

    return node.connections.map(conn => this.nodes.get(conn.target.id)).filter(n => n) as NeuralMeshNode[];
  }

  getStatus(): any {
    return {
      isRunning: this.isRunning,
      nodeCount: this.nodes.size,
      connectionCount: this.getConnectionCount(),
      averageConnections: this.getAverageConnections(),
      topology: this.topology,
      runActive: this.dynamicUpdatesActive,
      runStartedAt: this.runStartedAt ? new Date(this.runStartedAt) : undefined,
      maxRunDurationMs: this.maxRunDurationMs,
      remainingTimeMs: this.runStartedAt ? Math.max(0, this.maxRunDurationMs - (Date.now() - this.runStartedAt)) : undefined
    };
  }

  setMaxRunDuration(durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      this.maxRunDurationMs = 0;
      this.clearRunTimeout();
      return;
    }

    this.maxRunDurationMs = durationMs;
    if (this.dynamicUpdatesActive) {
      this.scheduleRunTimeout();
    }
  }

  private activateUpdates(trigger: 'initialize' | 'configure' | 'manual'): void {
    if (this.updateInterval) {
      this.runStartedAt = Date.now();
      this.scheduleRunTimeout();
      return;
    }

    this.dynamicUpdatesActive = true;
    this.runStartedAt = Date.now();
    this.updateInterval = setInterval(() => {
      this.updateTopology();
    }, this.updateIntervalMs);
    this.scheduleRunTimeout();
    this.logger.info('neural-mesh', 'Topology updates activated', {
      trigger,
      maxRunDurationMs: this.maxRunDurationMs
    });
    this.emit('runStarted', { trigger, startedAt: new Date(this.runStartedAt) });
  }

  private stopDynamicUpdates(reason: 'manual' | 'timeout'): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }

    this.clearRunTimeout();

    if (!this.dynamicUpdatesActive && reason === 'manual') {
      return;
    }

    const startedAt = this.runStartedAt;
    const durationMs = startedAt ? Date.now() - startedAt : undefined;
    this.dynamicUpdatesActive = false;
    this.runStartedAt = undefined;

    if (reason === 'timeout') {
      this.logger.warn('neural-mesh', 'Topology updates stopped due to max runtime', {
        maxRunDurationMs: this.maxRunDurationMs,
        durationMs
      });
    } else {
      this.logger.info('neural-mesh', 'Topology updates stopped');
    }

    this.emit('runStopped', { reason, durationMs, startedAt: startedAt ? new Date(startedAt) : undefined });
    this.emit('topologyUpdated', this.getTopology());
  }

  private scheduleRunTimeout(): void {
    this.clearRunTimeout();

    if (!Number.isFinite(this.maxRunDurationMs) || this.maxRunDurationMs <= 0 || !this.dynamicUpdatesActive) {
      return;
    }

    this.runTimeout = setTimeout(() => {
      this.logger.warn('neural-mesh', 'Mesh orchestration exceeded configured max duration; stopping');
      this.stopDynamicUpdates('timeout');
    }, this.maxRunDurationMs);
  }

  private clearRunTimeout(): void {
    if (this.runTimeout) {
      clearTimeout(this.runTimeout);
      this.runTimeout = undefined;
    }
  }
}
