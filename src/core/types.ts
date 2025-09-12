/**
 * Core interfaces and types for the Codex-Beta system
 */

export interface AgentId {
  id: string;
  type: AgentType;
  version: string;
}

export enum AgentType {
  CODE_WORKER = 'code_worker',
  DATA_WORKER = 'data_worker', 
  VALIDATION_WORKER = 'validation_worker',
  SWARM_COORDINATOR = 'swarm_coordinator',
  CONSENSUS_COORDINATOR = 'consensus_coordinator',
  TOPOLOGY_COORDINATOR = 'topology_coordinator',
  MCP_BRIDGE = 'mcp_bridge',
  A2A_BRIDGE = 'a2a_bridge'
}

export interface AgentCapability {
  name: string;
  version: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AgentMetadata {
  id: AgentId;
  capabilities: AgentCapability[];
  resources: ResourceRequirements;
  networkInfo: NetworkInfo;
  status: AgentStatus;
  created: Date;
  lastUpdated: Date;
}

export interface ResourceRequirements {
  cpu: number; // CPU cores
  memory: number; // MB
  storage: number; // MB
  bandwidth: number; // Mbps
}

export interface NetworkInfo {
  address: string;
  port: number;
  protocol: 'tcp' | 'udp' | 'ws' | 'grpc';
  endpoints: string[];
}

export enum AgentStatus {
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  SHUTTING_DOWN = 'shutting_down',
  OFFLINE = 'offline'
}

export interface Task {
  id: string;
  type: string;
  priority: number;
  requiredCapabilities: string[];
  payload: Record<string, any>;
  created: Date;
  deadline?: Date;
  assignedTo?: AgentId;
  status: TaskStatus;
  result?: any;
  error?: string;
}

export enum TaskStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  RUNNING = 'running', 
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface Message {
  id: string;
  from: AgentId;
  to: AgentId | 'broadcast';
  type: MessageType;
  payload: any;
  timestamp: Date;
  signature?: string;
}

export enum MessageType {
  TASK_ASSIGNMENT = 'task_assignment',
  TASK_RESULT = 'task_result',
  HEARTBEAT = 'heartbeat',
  CAPABILITY_DISCOVERY = 'capability_discovery',
  CONSENSUS_PROPOSAL = 'consensus_proposal',
  CONSENSUS_VOTE = 'consensus_vote',
  MESH_UPDATE = 'mesh_update',
  BRIDGE_REQUEST = 'bridge_request',
  BRIDGE_RESPONSE = 'bridge_response'
}

export interface ConsensusProposal {
  id: string;
  type: string;
  proposer: AgentId;
  data: any;
  timestamp: Date;
  requiredVotes: number;
}

export interface ConsensusVote {
  proposalId: string;
  voter: AgentId;
  vote: boolean;
  signature: string;
  timestamp: Date;
}

export interface TopologyConstraint {
  type: 'bandwidth' | 'latency' | 'security' | 'resource';
  source?: AgentId;
  target?: AgentId;
  constraint: any;
  priority: number;
}

export interface NeuralMeshNode {
  agent: AgentId;
  position: number[];
  connections: Connection[];
  state: Record<string, any>;
  lastUpdate: Date;
}

export interface Connection {
  target: AgentId;
  weight: number;
  type: 'sync' | 'async' | 'stream';
  protocol: string;
  lastActivity: Date;
}

export interface SwarmConfiguration {
  algorithm: 'pso' | 'aco' | 'flocking' | 'hybrid';
  parameters: Record<string, any>;
  objectives: string[];
  constraints: TopologyConstraint[];
}