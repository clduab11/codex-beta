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

  constructor(private agentRegistry: AgentRegistry) {
    super();
    this.logger.info('neural-mesh', 'Neural mesh created');
  }

  async initialize(): Promise<void> {
    this.logger.info('neural-mesh', 'Initializing neural mesh...');
    
    this.isRunning = true;
    
    // Start topology update loop
    this.updateInterval = setInterval(() => {
      this.updateTopology();
    }, 5000); // Update every 5 seconds

    this.setupEventHandlers();
    
    this.logger.info('neural-mesh', 'Neural mesh initialized');
  }

  async shutdown(): Promise<void> {
    this.logger.info('neural-mesh', 'Shutting down neural mesh...');
    
    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }

    this.nodes.clear();
    
    this.logger.info('neural-mesh', 'Neural mesh shutdown complete');
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
    this.establishConnections(node);
    
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
  }

  private generateRandomPosition(): number[] {
    return [Math.random() * 100, Math.random() * 100, Math.random() * 100];
  }

  private establishConnections(node: NeuralMeshNode): void {
    const maxConnections = 5;
    const allNodes = Array.from(this.nodes.values()).filter(n => n.agent.id !== node.agent.id);
    
    // Connect to nearby nodes (simplified - in reality would use more sophisticated algorithms)
    const nearbyNodes = allNodes
      .sort(() => Math.random() - 0.5) // Random for now
      .slice(0, Math.min(maxConnections, allNodes.length));

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

  private updateTopology(): void {
    if (!this.isRunning) return;

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
      topology: this.topology
    };
  }
}