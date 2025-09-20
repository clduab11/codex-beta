# AGENTS.md - Codex-Optimized Agent Guidance for The-Fantasizer

This document provides comprehensive guidance for AI agents, specifically optimized for OpenAI Codex, when working on the `the-fantasizer` project. It merges insights from various agentic frameworks, incorporates project-specific discoveries, and outlines best practices for code generation, debugging, and optimization workflows.

## 📋 Table of Contents

1.  [Project Discoveries & Architecture](#1-project-discoveries--architecture)
2.  [AI Agent Guidelines (Codex Optimized)](#2-ai-agent-guidelines-codex-optimized)
    *   [General Principles](#general-principles)
    *   [Codex Prompt Engineering Patterns](#codex-prompt-engineering-patterns)
    *   [Code Generation Workflow](#code-generation-workflow)
    *   [Debugging Workflow](#debugging-workflow)
    *   [Optimization Workflow](#optimization-workflow)
3.  [Agent Types and Roles](#3-agent-types-and-roles)
    *   [Core Development Agents](#core-development-agents)
    *   [Swarm Coordination Agents](#swarm-coordination-agents)
    *   [Specialized Agents](#specialized-agents)
    *   [GitHub Integration Agents](#github-integration-agents)
    *   [Performance & Consensus Agents](#performance-consensus-agents)
    *   [Consensus Systems Agents](#consensus-systems-agents)
    *   [GitHub Integration Agents](#github-integration-agents-hive)
    *   [Performance & Optimization Agents](#performance-optimization-agents)
    *   [Development Support Agents](#development-support-agents)
    *   [System Architecture Agents](#system-architecture-agents)
    *   [Intelligence & Analysis Agents](#intelligence-analysis-agents)
4.  [Agent Spawn Prompts and Templates](#4-agent-spawn-prompts-and-templates)
    *   [Swarm Patterns](#swarm-patterns)
    *   [Agent Coordination Protocol](#agent-coordination-protocol)
    *   [Hive-Mind Spawn](#hive-mind-spawn)
    *   [Agent Spawn](#agent-spawn)
5.  [Swarm Coordination Patterns](#5-swarm-coordination-patterns)
    *   [Swarm Topologies](#swarm-topologies)
    *   [Advanced Swarm Topologies](#advanced-swarm-topologies)
    *   [Collective Intelligence Patterns](#collective-intelligence-patterns)
6.  [A2A Messaging Protocols and Implementations](#6-a2a-messaging-protocols-and-implementations)
    *   [A2A Protocol Message Format Specification](#a2a-protocol-message-format-specification)
    *   [Message Routing Mechanisms](#message-routing-mechanisms)
    *   [Message Flow Patterns](#message-flow-patterns)
    *   [Cross-Protocol Translation](#cross-protocol-translation)
7.  [Consensus Mechanisms](#7-consensus-mechanisms)
    *   [Byzantine Fault-Tolerant Consensus](#byzantine-fault-tolerant-consensus)
    *   [Raft Consensus](#raft-consensus)
    *   [Consensus Builder](#consensus-builder)
    *   [Emergent Consensus](#emergent-consensus)
    *   [Democratic Voting](#democratic-voting)
    *   [Weighted Expertise](#weighted-expertise)
    *   [Hierarchical Decision](#hierarchical-decision)
8.  [Neural Mesh Architectures and Topologies](#8-neural-mesh-architectures-and-topologies)
    *   [Mesh Network Topology](#mesh-network-topology)
    *   [Service Discovery Architecture](#service-discovery-architecture)
    *   [Node Communication Patterns](#node-communication-patterns)
    *   [Neural Patterns Table](#neural-patterns-table)
    *   [Quantum-Classical Hybrid Processing](#quantum-classical-hybrid-processing)
9.  [MCP Tool Definitions and Usage Patterns](#9-mcp-tool-definitions-and-usage-patterns)
    *   [Key MCP Tools](#key-mcp-tools)
    *   [MCP Protocol Bridge Architecture](#mcp-protocol-bridge-architecture)
    *   [Tool Registry](#tool-registry)
    *   [Protocol Translation Engine](#protocol-translation-engine)
    *   [Enhanced Routing Configuration](#enhanced-routing-configuration)
    *   [Tool Integration Examples](#tool-integration-examples)
10. [Memory Management Patterns and Distributed Storage](#10-memory-management-patterns-and-distributed-storage)
    *   [Memory Operations](#memory-operations)
    *   [Memory Architecture (SQLite Schema)](#memory-architecture-sqlite-schema)
    *   [Memory Operations Performance](#memory-operations-performance)
    *   [Memory Sharing Protocols](#memory-sharing-protocols)
    *   [Memory Commands](#memory-commands)
12. [Build & Test Commands](#12-build--test-commands)
13. [Domain-Specific Logic: Fantasy Sports](#13-domain-specific-logic-fantasy-sports)
14. [Further Reading](#14-further-reading)

---

## 1. Project Discoveries & Architecture

### Project Structure & Architecture
-   **Nested Frontend**: The path `src/frontend/src/frontend/` indicates an incomplete or unusual migration. Be aware of this deep nesting when referencing frontend files.
-   **Polyglot Stack**: This project uses both Node.js (frontend) and Python (backend, AI/ML). AI/ML components leverage PyTorch, scikit-learn, XGBoost, and Optuna.
-   **AI-First Workflow**: The presence of `.claude-flow/` directories suggests an AI-assisted development workflow. Hive Systems integration is also present, indicating a multi-AI agent environment.
-   **Enterprise Infrastructure**: Despite being a consumer fantasy sports app, the project utilizes enterprise-grade infrastructure like Kubernetes and Terraform.
-   **File-Based Secrets**: Secrets are managed via files within Docker, which is an unusual pattern.
-   **Platform-Specific GPU**: GPU configurations differ for Apple Silicon (Metal) and NVIDIA.
-   **Health Monitor Telemetry**: RSS-driven `memoryStatus` metrics now flow into telemetry so the CLI shows actual usage, limits, and headroom in real time.
-   **Orchestration Ceiling**: Neural mesh and swarm runs auto-stop after the 60-minute ceiling (configurable via `mesh.maxRunDurationMs` and `swarm.maxRunDurationMs`) and emit timeout events.
-   **Idle Heartbeats**: Registry-managed synthetic heartbeats keep idle agents from ageing out of the 90 s window, eliminating false offline warnings in `logs/registry.log`.
-   **GPU Probe Cache**: `gpu.probeCacheTtlMs` memoizes expensive hardware probes, while `gpu.disableProbeCache` forces a fresh scan when diagnostics are required.
-   **MCP Protocol Bridge**: Integrates external tools and services, enabling cross-protocol communication and enhanced routing.
-   **A2A Messaging Protocol**: JSON-RPC 2.0 based communication for secure, efficient, and scalable agent coordination with consensus mechanisms and distributed memory.
-   **Mesh Network Topology**: Self-organizing, fault-tolerant service discovery and dynamic load balancing across distributed agent clusters.
-   **System Hardening Layer**: Core system now boots authentication, authorization middleware, global error handling, and resource governance (circuit breakers, rate limiting, auto-scaling hints) before exposing agent services.
-   **CLI + Daemon Tooling**: Session-aware CLI tracks telemetry, manages workflows, and can spawn a background daemon via `background start/status/stop`, enabling long-running orchestration outside the interactive shell.
-   **Persistent Storage & Logging**: Storage manager plus component-specific log streams (under `logs/`) capture workflow artifacts, hive-mind scans, and lifecycle events for replay and auditing.
-   **Vitest-Based Verification**: Local test harness upgraded to Vitest with suites covering CLI lifecycle, command UX, configuration persistence, and swarm optimisation behaviour.
-   **GPU Manager**: Unified detection for CUDA (NVIDIA) and MPS (Apple Metal) surfaces device metadata, sets environment hints, memoizes probes, and feeds telemetry for agent scheduling.

---

## 2. AI Agent Guidelines (Codex Optimized)

### General Principles
-   **Concurrent Execution**: Prioritize batching all related operations (file reads/writes, task spawning, bash commands) into a single message for efficiency.
-   **Modularity**: Generate concise, single-responsibility code components (under 300 lines where possible).
-   **Context-Rich Interactions**: Provide explicit context (function signatures, data structures, expected inputs/outputs) in prompts.
-   **Iterative Refinement**: Focus on enhancing existing code unless fundamental changes are justified.
-   **Quality First**: Deliver well-tested, documented, and secure code.

### Codex Prompt Engineering Patterns

When interacting with Codex, structure prompts to maximize clarity and leverage its code generation capabilities.

#### 1. Code Generation
-   **Clear Objective**: State the exact function or component to be created.
-   **Input/Output**: Define expected parameters, their types, and the return type.
-   **Context**: Provide relevant existing code snippets, data models, or API interfaces.
-   **Constraints**: Specify performance, security, or style requirements.
-   **Example**:
    ```
    "Generate a TypeScript function `calculateFantasyPoints(playerStats: PlayerStats): number` that computes fantasy points based on NFL scoring rules. PlayerStats interface is { touchdowns: number, yards: number, receptions: number }. Use standard PPR scoring."
    ```

#### 2. Debugging
-   **Problem Description**: Clearly articulate the bug, error message, and observed behavior.
-   **Relevant Code**: Provide the problematic code block and surrounding context.
-   **Expected Behavior**: Describe what the code *should* do.
-   **Steps to Reproduce**: Outline how to trigger the bug.
-   **Example**:
    ```
    "Debug the `optimizeLineup` Python function. It's returning an empty lineup even when valid players are available. The error is 'IndexError: list index out of range' at line 45. The function takes `availablePlayers: List[Player]`, `salaryCap: int`, `teamSize: int`. Expected: returns a list of Player objects. Here's the function code: [code block]"
    ```

#### 3. Optimization
-   **Target Metric**: Specify what needs to be optimized (e.g., performance, memory, readability).
-   **Current Code**: Provide the code section to be optimized.
-   **Goal**: Quantify the desired improvement (e.g., "reduce CPU usage by 20%", "improve readability for new developers").
-   **Context**: Mention any constraints or dependencies.
-   **Example**:
    ```
    "Optimize the `realTimeLeaderboardUpdate` JavaScript function for performance. It's causing UI lag during high-frequency updates. Goal: Reduce execution time by 30%. Consider using memoization or a more efficient data structure. Current function: [code block]"
    ```

### Code Generation Workflow
1.  **Understand Requirements**: Analyze the task, including functional and non-functional requirements.
2.  **Design & Pseudocode**: Outline the high-level structure and logic.
3.  **Generate Code**: Use Codex with specific prompts, providing context and constraints.
4.  **Review & Refine**: Critically evaluate generated code for correctness, style, and adherence to requirements.
5.  **Test**: Implement unit and integration tests.

### Debugging Workflow
1.  **Identify Issue**: Pinpoint the exact problem (error message, unexpected behavior).
2.  **Gather Context**: Collect relevant code, logs, and reproduction steps.
3.  **Formulate Hypothesis**: Propose potential causes for the bug.
4.  **Query Codex**: Ask for potential fixes or diagnostic steps, providing all gathered context.
5.  **Test Fix**: Apply suggested changes and verify resolution.

### Optimization Workflow
1.  **Benchmark Current State**: Measure performance or resource usage of the target code.
2.  **Identify Bottlenecks**: Use profiling tools to locate inefficient sections.
3.  **Propose Optimizations**: Query Codex for alternative algorithms, data structures, or refactoring suggestions.
4.  **Implement & Re-benchmark**: Apply changes and measure impact.
5.  **Validate**: Ensure functionality remains correct after optimization.

---

## 3. Agent Types and Roles

This section details the various AI agent types and their specific roles, as defined in CLAUDE.md and GEMINI.md.

### Core Development Agents (Agent Systems)

| Agent | Purpose (Agent Framework) | Purpose (Hive Systems) |
|-------|-----------------------|-----------------------|
| `coder` | Implementation | Code implementation and development |
| `reviewer` | Code quality | Code review and quality control |
| `tester` | Test creation | Automated testing and quality assurance |
| `planner` | Strategic planning | Strategic planning and task decomposition |
| `researcher` | Information gathering | Information gathering and analysis |

### Swarm Coordination Agents (Agent Systems)

| Agent | Purpose (Agent Framework) | Purpose (Hive Systems) |
|-------|-----------------------|-----------------------|
| `hierarchical-coordinator` | Queen-led | Top-down hierarchical swarm management |
| `mesh-coordinator` | Peer-to-peer | Peer-to-peer mesh network coordination |
| `adaptive-coordinator` | Dynamic topology | Dynamic topology adaptation and optimization |
| `collective-intelligence-coordinator` | Hive-mind | Swarm learning coordination |
| `swarm-memory-manager` | Distributed memory | Distributed memory management |

### Specialized Agents (Agent Framework)

| Agent | Purpose |
|-------|---------|
| `backend-dev` | API development |
| `mobile-dev` | React Native |
| `ml-developer` | Machine learning |
| `system-architect` | High-level design |
| `sparc-coder` | TDD implementation |
| `production-validator` | Real validation |

### GitHub Integration Agents (Agent Framework)

| Agent | Purpose |
|-------|---------|
| `github-modes` | Comprehensive integration |
| `pr-manager` | Pull requests |
| `code-review-swarm` | Multi-agent review |
| `issue-tracker` | Issue management |
| `release-manager` | Release coordination |

### Performance & Consensus Agents (Agent Framework)

| Agent | Purpose |
|-------|---------|
| `perf-analyzer` | Bottleneck identification |
| `performance-benchmarker` | Performance testing |
| `byzantine-coordinator` | Fault tolerance |
| `raft-manager` | Leader election |
| `consensus-builder` | Decision-making |

### Consensus Systems Agents (Hive Systems)

| Agent | Purpose |
|-------|---------|
| `byzantine-coordinator` | Byzantine fault-tolerant consensus with 99% reliability |
| `quorum-manager` | Dynamic quorum size adjustment and verification |
| `security-manager` | Cryptographic security and access control |
| `gossip-coordinator` | Gossip protocol for eventual consistency |
| `performance-benchmarker` | System performance analysis and optimization |
| `raft-manager` | Raft consensus with leader election |
| `crdt-synchronizer` | Conflict-free replicated data types management |
| `byzantine-fault-tolerant` | Advanced Byzantine fault tolerance implementation |
| `raft-consensus` | Raft distributed consensus algorithm |
| `gossip-protocol` | Epidemic information dissemination protocol |
| `crdt-manager` | Conflict-free replicated data type coordination |
| `paxos-coordinator` | Paxos consensus algorithm implementation |
| `blockchain-consensus` | Blockchain-style consensus mechanisms |
| `vector-clock-sync` | Vector clock synchronization for causal ordering |

### GitHub Integration Agents (Hive Systems)

| Agent | Purpose |
|-------|---------|
| `pr-manager` | Pull request lifecycle management |
| `code-review-swarm` | Distributed code review coordination |
| `issue-tracker` | Issue tracking and triage automation |
| `project-board-sync` | Project board synchronization |
| `github-modes` | GitHub workflow mode management |
| `workflow-automation` | CI/CD workflow automation |
| `multi-repo-swarm` | Cross-repository coordination |
| `sync-coordinator` | Repository synchronization management |
| `release-swarm` | Release process orchestration |
| `release-manager` | Semantic versioning and changelogs |
| `swarm-pr` | PR-based swarm coordination |
| `swarm-issue` | Issue-based task distribution |
| `repo-architect` | Repository structure optimization |
| `security-scanner` | Automated security vulnerability scanning |
| `documentation-sync` | Documentation synchronization across repos |
| `changelog-generator` | Automated changelog generation |
| `dependency-updater` | Dependency update management and testing |

### Performance & Optimization Agents (Hive Systems)

| Agent | Purpose |
|-------|---------|
| `perf-analyzer` | Performance bottleneck detection |
| `task-orchestrator` | Workflow orchestration and scheduling |
| `memory-coordinator` | Memory optimization and garbage collection |
| `swarm-memory-manager` | Distributed memory management |
| `collective-intelligence-coordinator` | Swarm learning coordination |
| `consensus-builder` | Decision consensus optimization |
| `performance-monitor` | Real-time performance monitoring and alerting |
| `load-balancer` | Dynamic load balancing across agents |
| `cache-optimizer` | Intelligent caching strategy optimization |
| `query-optimizer` | Database and search query optimization |
| `resource-allocator` | Optimal resource allocation and scheduling |
| `bottleneck-analyzer` | Advanced bottleneck detection and resolution |

### Development Support Agents (Hive Systems)

| Agent | Purpose |
|-------|---------|
| `sparc-coord` | SPARC methodology coordination |
| `sparc-coder` | SPARC-based code generation |
| `tdd-london-swarm` | TDD London School methodology |
| `api-docs` | API documentation generation |
| `cicd-engineer` | CI/CD pipeline optimization |
| `production-validator` | Production readiness validation |

### System Architecture Agents (Hive Systems)

| Agent | Purpose |
|-------|---------|
| `system-architect` | System design and architecture |
| `migration-planner` | System migration planning |
| `backend-dev` | Backend service development |
| `mobile-dev` | Mobile application development |

### Intelligence & Analysis Agents (Hive Systems)

| Agent | Purpose |
|-------|---------|
| `smart-agent` | Adaptive intelligence and learning |
| `code-analyzer` | Static code analysis and metrics |
| `general-purpose` | Versatile task handling |
| `refinement` | Solution refinement and optimization |
| `pseudocode` | Algorithm design and planning |

---
---

## 4. Agent Spawn Prompts and Templates

This section outlines the various methods and configurations for spawning agents and orchestrating tasks within both Agent Framework and Hive Systems.

### Agent Framework Swarm Patterns

Agent Framework emphasizes concurrent execution and batching of operations for maximum efficiency.

#### Full-Stack Swarm (8 agents)

```bash
Task("Architecture", "System design and component architecture", "system-architect")
Task("Backend", "API development and database integration", "backend-dev")
Task("Frontend", "React Native mobile development", "mobile-dev")
Task("Database", "Data modeling and optimization", "coder")
Task("API Docs", "API documentation generation", "api-docs")
Task("CI/CD", "Pipeline optimization and deployment", "cicd-engineer")
Task("Testing", "Performance testing and benchmarking", "performance-benchmarker")
Task("Validation", "Production readiness validation", "production-validator")
```

#### Agent Count Rules

1. **CLI Args First**: `npx claude-flow@alpha --agents 5`
2. **Auto-Decide**: Simple (3-4), Medium (5-7), Complex (8-12)

#### Research Task Example

```javascript
// Single message with all operations
mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 5 }
mcp__claude-flow__agent_spawn { type: "researcher" }
mcp__claude-flow__agent_spawn { type: "code-analyzer" }
mcp__claude-flow__task_orchestrate { task: "Research patterns" }
```

#### Development Task Example (TodoWrite)

```javascript
// All todos in ONE call
TodoWrite { todos: [
  { id: "1", content: "Design API", status: "in_progress", priority: "high" },
  { id: "2", content: "Implement auth", status: "pending", priority: "high" },
  { id: "3", content: "Write tests", status: "pending", priority: "medium" },
  { id: "4", content: "Documentation", status: "pending", priority: "low" }
]}
```

### Agent Framework Agent Coordination Protocol

Every agent must follow a strict protocol for task execution:

#### 1️⃣ START Phase
```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

#### 2️⃣ DURING Phase (After EVERY step)
```bash
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[decision]"
```

#### 3️⃣ END Phase
```bash
npx claude-flow@alpha hooks post-task --task-id "[task]" --analyze-performance true
npx claude-flow@alpha hooks session-end --export-metrics true
```

### Hive Systems Hive-Mind Spawn

The [`gemini-flow hive-mind spawn`](GEMINI.md:236) command initializes a hive-mind with various configurations.

```bash
gemini-flow hive-mind spawn <objective> [options]
  --nodes <number>      Number of nodes (default: 5)
  --queen              Include queen coordinator
  --worker-types <types> Comma-separated worker types
  --gemini             Use Gemini AI integration (loads GEMINI.md)
```

#### Hive-Mind Command Examples

```bash
# Check status
gemini-flow hive-mind status [hiveId] [options]
  --detailed           Show detailed information

# Request consensus
gemini-flow hive-mind consensus <hiveId> <proposal> [options]
  --timeout <ms>       Consensus timeout (default: 30000)

# Manage memory
gemini-flow hive-mind memory <hiveId> [options]
  --store <key:value>  Store memory
  --retrieve <key>     Retrieve memory
  --list               List all memories

# Synchronize hive
gemini-flow hive-mind sync <hiveId> [options]
  --force              Force synchronization
  --all                Sync all active hives
```

### Hive Systems Agent Spawn

The [`gemini-flow agent spawn`](GEMINI.md:308) command creates individual agents with specific capabilities.

```bash
gemini-flow agent spawn [options]
  --type <type>        Agent type (required)
  --name <name>        Custom agent name
  --capabilities <list> Agent capabilities
```

#### Agent Management Commands

```bash
# List agents
gemini-flow agent list [options]
  --filter <status>    Filter: all|active|idle|busy
  --swarm <id>         Filter by swarm ID

# Get agent metrics
gemini-flow agent metrics [options]
  --agent-id <id>      Specific agent ID
  --metric <type>      Metric: all|cpu|memory|tasks|performance

# Get agent info
gemini-flow agent info <agentId>

# Terminate agent
gemini-flow agent terminate <agentId> [options]
  --force              Force termination

# List agent types
gemini-flow agent types [options]
  --category <name>    Filter by category
  --detailed           Show detailed descriptions
```


## 5. Swarm Coordination Patterns

## 6. A2A Messaging Protocols and Implementations

The A2A (Agent-to-Agent) Protocol provides a robust, JSON-RPC 2.0 based communication framework enabling secure, efficient, and scalable agent coordination with built-in consensus mechanisms and distributed memory management.

### A2A Protocol Message Format Specification

#### Base Message Structure

```typescript
interface A2AMessage {
  id: string;                    // Unique message identifier
  method: string;                // Method name (dot notation)
  params: any;                   // Method parameters
  protocol: 'a2a';              // Protocol identifier
  version: '2.0';               // JSON-RPC version
  metadata: MessageMetadata;     // A2A-specific metadata
}

interface MessageMetadata {
  timestamp: number;             // Unix timestamp
  sender: AgentId;               // Sending agent identifier
  priority: MessagePriority;     // Message priority level
  routing: RoutingInfo;          // Routing instructions
  security: SecurityContext;     // Security metadata
  tracing: TracingInfo;          // Distributed tracing
}

enum MessagePriority {
  CRITICAL = 0,    // System critical messages
  HIGH = 1,        // High priority operations
  NORMAL = 2,      // Standard operations
  LOW = 3,         // Background tasks
  BULK = 4         // Batch operations
}
```

#### Request Message Format

```typescript
interface A2ARequest extends A2AMessage {
  method: string;                // e.g., "agentspace.create_workspace"
  params: {
    [key: string]: any;          // Method-specific parameters
    _a2a?: {                     // A2A protocol extensions
      timeout?: number;          // Request timeout (ms)
      retryPolicy?: RetryPolicy; // Retry configuration
      consensus?: boolean;       // Require consensus
      persistence?: boolean;     // Persist to memory
    }
  };
}

// Example: AgentSpace workspace creation
const workspaceRequest: A2ARequest = {
  id: "req_agentspace_001",
  method: "agentspace.create_workspace",
  params: {
    workspaceId: "research-alpha-001",
    resources: {
      cpu: 4,
      memory: 8192,
      storage: 100
    },
    security: {
      isolation: "enhanced",
      encryption: true
    },
    _a2a: {
      timeout: 30000,
      consensus: true,
      persistence: true
    }
  },
  protocol: "a2a",
  version: "2.0",
  metadata: {
    timestamp: 1692123456789,
    sender: "coordinator-agent-001",
    priority: MessagePriority.HIGH,
    routing: {
      target: "agentspace-cluster",
      strategy: "capability_based"
    },
    security: {
      authToken: "jwt_token_here",
      permissions: ["workspace.create"]
    },
    tracing: {
      traceId: "trace_001",
      spanId: "span_agentspace_001"
    }
  }
};
```

#### Response Message Format

```typescript
interface A2AResponse {
  id: string;                    // Matching request ID
  result?: any;                  // Success result
  error?: A2AError;              // Error information
  metadata: ResponseMetadata;    // Response metadata
}

interface A2AError {
  code: number;                  // Error code
  message: string;               // Error message
  data?: any;                    // Additional error data
  type: A2AErrorType;           // Error classification
  retryable: boolean;           // Can be retried
}

enum A2AErrorType {
  VALIDATION_ERROR = "validation_error",
  AUTHENTICATION_ERROR = "authentication_error",
  AUTHORIZATION_ERROR = "authorization_error",
  RESOURCE_ERROR = "resource_error",
  NETWORK_ERROR = "network_error",
  TIMEOUT_ERROR = "timeout_error",
  CONSENSUS_ERROR = "consensus_error",
  INTERNAL_ERROR = "internal_error"
}
```

### Message Routing Mechanisms

#### Routing Strategies

```typescript
enum RoutingStrategy {
  DIRECT = "direct",             // Direct agent-to-agent
  BROADCAST = "broadcast",       // One-to-many
  MULTICAST = "multicast",       // Group communication
  CONSENSUS = "consensus",       // Consensus-based routing
  CAPABILITY = "capability",     // Capability-based routing
  LOAD_BALANCED = "load_balanced" // Load-balanced routing
}

interface RoutingInfo {
  strategy: RoutingStrategy;
  target?: string | string[];    // Target agent(s) or cluster
  capabilities?: string[];       // Required capabilities
  constraints?: RoutingConstraints;
  fallback?: RoutingInfo;       // Fallback routing
}

interface RoutingConstraints {
  geographic?: string;          // Geographic preference
  performance?: string;         // Performance requirements
  security?: string;           // Security requirements
  cost?: string;              // Cost optimization
}

// Example: Capability-based routing for video generation
const videoRoutingInfo: RoutingInfo = {
  strategy: RoutingStrategy.CAPABILITY,
  capabilities: ["video_generation", "gpu_acceleration"],
  constraints: {
    performance: "high",
    geographic: "us-west-1"
  },
  fallback: {
    strategy: RoutingStrategy.LOAD_BALANCED,
    target: "veo3-cluster"
  }
};
```

### Message Flow Patterns

```typescript
// 1. Request-Response Pattern
async function requestResponse(agent: Agent, request: A2ARequest): Promise<A2AResponse> {
  const response = await agent.send(request);
  return response;
}

// 2. Publish-Subscribe Pattern
class A2AEventBus {
  async publish(topic: string, event: A2AEvent): Promise<void> {
    const subscribers = await this.getSubscribers(topic);
    await Promise.all(subscribers.map(sub => sub.notify(event)));
  }
  
  async subscribe(agent: Agent, topic: string, handler: EventHandler): Promise<void> {
    this.subscriptions.set(topic, [...this.getSubscribers(topic), { agent, handler }]);
  }

## 7. Consensus Mechanisms

This section details the various consensus mechanisms employed for decision-making and fault tolerance across the agent systems.

### Byzantine Fault-Tolerant Consensus

Both Agent Framework and Hive Systems utilize Byzantine fault-tolerant consensus for handling malicious or faulty agents in distributed systems.

- **Agent Framework**: [`byzantine-coordinator`](CLAUDE.md:103) agent for fault tolerance
- **Hive Systems**: [`byzantine-coordinator`](GEMINI.md:469) agent for Byzantine fault-tolerant consensus with 99% reliability

#### Byzantine Algorithm Implementation

```typescript
interface ByzantineConsensusConfig {
  nodeCount: number;               // Total number of nodes
  faultTolerance: number;          // Maximum faulty nodes (f)
  minimumNodes: number;            // 3f + 1 minimum requirement
  consensusTimeout: number;        // Timeout for consensus rounds
  viewChangeTimeout: number;       // View change timeout
  cryptographicProofs: boolean;    // Enable cryptographic verification
}

class ByzantineConsensusEngine {
  private nodes: Map<string, ByzantineNode> = new Map();
  private currentView: number = 0;
  private consensusRounds: Map<string, ConsensusRound> = new Map();
  
  constructor(private config: ByzantineConsensusConfig) {
    this.validateConfiguration();
  }
  
  async proposeValue(value: any, proposer: string): Promise<ConsensusResult> {
    const roundId = this.generateRoundId();
    const proposal: ConsensusProposal = {
      roundId,
      value,
      proposer,
      timestamp: Date.now(),
      view: this.currentView
    };
    
    // Phase 1: Prepare phase
    const prepareResponses = await this.sendPrepareMessages(proposal);
    if (!this.hasMajority(prepareResponses)) {
      throw new ConsensusError('Failed to achieve prepare phase majority');
    }
    
    // Phase 2: Commit phase
    const commitResponses = await this.sendCommitMessages(proposal);
    if (!this.hasMajority(commitResponses)) {
      throw new ConsensusError('Failed to achieve commit phase majority');
    }
    
    // Phase 3: Apply decision
    return this.applyDecision(proposal, commitResponses);
  }
  
  private validateConfiguration(): void {
    const requiredNodes = 3 * this.config.faultTolerance + 1;
    if (this.config.nodeCount < requiredNodes) {
      throw new Error(`Insufficient nodes: need ${requiredNodes}, have ${this.config.nodeCount}`);
    }
  }
}
```

### Raft Consensus

Raft consensus provides leader election and log replication for distributed systems.

- **Agent Framework**: [`raft-manager`](CLAUDE.md:104) agent for leader election
- **Hive Systems**: [`raft-manager`](GEMINI.md:475) agent for Raft consensus with leader election

#### Raft Algorithm Implementation

```typescript
interface RaftNode {
  id: string;
  state: NodeState;
  currentTerm: number;
  votedFor: string | null;
  log: LogEntry[];
  commitIndex: number;
  lastApplied: number;
  
  // Leader state
  nextIndex?: Map<string, number>;
  matchIndex?: Map<string, number>;
}

enum NodeState {
  FOLLOWER = 'follower',
  CANDIDATE = 'candidate',
  LEADER = 'leader'
}

class RaftConsensusManager {
  private nodes: Map<string, RaftNode> = new Map();
  private electionTimeout: number = 150; // ms
  private heartbeatInterval: number = 50; // ms
  
  async electLeader(): Promise<string> {
    const candidateId = this.selectCandidate();
    const candidate = this.nodes.get(candidateId)!;
    
    // Increment term and vote for self
    candidate.currentTerm++;
    candidate.state = NodeState.CANDIDATE;
    candidate.votedFor = candidateId;
    
    // Request votes from other nodes
    const voteResponses = await this.requestVotes(candidate);
    
    if (this.hasMajorityVotes(voteResponses)) {
      candidate.state = NodeState.LEADER;
      await this.sendHeartbeats(candidateId);
      return candidateId;
    }
    
    // Election failed, revert to follower
    candidate.state = NodeState.FOLLOWER;
    candidate.votedFor = null;
    throw new ConsensusError('Leader election failed');
  }
  
  async replicateLog(leaderId: string, entry: LogEntry): Promise<void> {
    const leader = this.nodes.get(leaderId)!;
    if (leader.state !== NodeState.LEADER) {
      throw new Error('Only leaders can replicate log entries');
    }
    
    // Append to leader's log
    leader.log.push(entry);
    
    // Replicate to followers
    const replicationPromises = Array.from(this.nodes.entries())
      .filter(([id, node]) => id !== leaderId && node.state === NodeState.FOLLOWER)
      .map(([id, node]) => this.replicateToFollower(leader, node, entry));
    
    const results = await Promise.allSettled(replicationPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    if (successCount >= Math.floor(this.nodes.size / 2)) {
      leader.commitIndex = leader.log.length - 1;
      await this.applyLogEntry(entry);
    }
  }
}
```

### Consensus Builder

Decision-making optimization through intelligent consensus building.

- **Agent Framework**: [`consensus-builder`](CLAUDE.md:105) agent for decision-making
- **Hive Systems**: [`consensus-builder`](GEMINI.md:513) agent for decision consensus optimization

#### Consensus Builder Implementation

```typescript
interface ConsensusBuilderConfig {
  strategies: ConsensusStrategy[];
  timeoutMs: number;
  retryAttempts: number;
  quorumSize: number;
  weightingFactors: WeightingFactor[];
}

enum ConsensusStrategy {
  MAJORITY_VOTE = 'majority_vote',
  WEIGHTED_CONSENSUS = 'weighted_consensus',
  HIERARCHICAL_APPROVAL = 'hierarchical_approval',
  EXPERT_OVERRIDE = 'expert_override',
  GRADUAL_CONVERGENCE = 'gradual_convergence'
}

class ConsensusBuilder {
  private strategies: Map<ConsensusStrategy, ConsensusHandler> = new Map();
  
  constructor(private config: ConsensusBuilderConfig) {
    this.initializeStrategies();
  }
  
  async buildConsensus(proposal: Proposal, participants: Agent[]): Promise<ConsensusResult> {
    for (const strategy of this.config.strategies) {
      try {
        const handler = this.strategies.get(strategy)!;
        const result = await handler.attemptConsensus(proposal, participants);
        
        if (result.achieved && result.confidence >= 0.7) {
          return result;
        }
      } catch (error) {
        this.logger.warn(`Consensus strategy ${strategy} failed`, error);
      }
    }
    
    throw new ConsensusError('All consensus strategies failed');
  }
}
```

### Emergent Consensus

Organic consensus formation based on agent performance and natural agreement patterns.

- **Type**: `emergent`
- **Threshold**: `0.7` (70% agreement required)
- **Timeout**: `5000` ms
- **Weights**: `performance` (Weight by agent performance)

```typescript
class EmergentConsensusEngine {
  async achieveEmergentConsensus(
    proposal: Proposal, 
    agents: Agent[], 
    config: EmergentConfig
  ): Promise<ConsensusResult> {
    const opinions = await this.gatherInitialOpinions(proposal, agents);
    let rounds = 0;
    let convergence = false;
    
    while (!convergence && rounds < config.maxRounds) {
      // Allow agents to influence each other
      const influences = await this.calculateInfluences(agents, opinions);
      
      // Update opinions based on influences
      for (const agent of agents) {
        const influence = influences.get(agent.id);
        opinions.set(agent.id, this.updateOpinion(
          opinions.get(agent.id)!,
          influence!,
          config.learningRate
        ));
      }
      
      // Check for convergence
      convergence = this.checkConvergence(opinions, config.threshold);
      rounds++;
    }
    
    return this.calculateFinalConsensus(opinions, config);
  }
}
```

### Democratic Voting

Simple majority-based democratic decision making.

- **Type**: `democratic`
- **Majority**: `0.51` (Simple majority)
- **Quorum**: `0.6` (60% participation required)
- **Anonymous**: `false`

```typescript
class DemocraticVotingEngine {
  async conductVote(
    proposal: Proposal, 
    voters: Agent[], 
    config: DemocraticConfig
  ): Promise<VotingResult> {
    // Ensure quorum is met
    if (voters.length < config.quorum * this.totalAgents) {
      throw new VotingError('Quorum not met for democratic vote');
    }
    
    // Collect votes
    const votes = await Promise.all(
      voters.map(voter => this.collectVote(voter, proposal))
    );
    
    // Tally results
    const tally = this.tallyVotes(votes);
    const totalVotes = votes.length;
    
    // Determine outcome
    const yesVotes = tally.yes;
    const majority = totalVotes * config.majority;
    
    return {
      passed: yesVotes >= majority,
      votes: tally,
      participation: totalVotes / this.totalAgents,
      confidence: yesVotes / totalVotes
    };
  }
}
```

### Weighted Expertise

Consensus based on agent expertise and historical performance.

- **Type**: `weighted`
- **Factors**: `['experience', 'accuracy', 'specialization']`
- **Minimum Weight**: `0.1`
- **Normalization**: `true`

```typescript
interface ExpertiseWeights {
  experience: number;      // 0.0 - 1.0
  accuracy: number;        // Historical accuracy rate
  specialization: number;  // Domain expertise level
  reputation: number;      // Peer-evaluated reputation
}

class WeightedExpertiseEngine {
  async calculateWeightedConsensus(
    proposal: Proposal,
    experts: Expert[],
    config: WeightedConfig
  ): Promise<WeightedConsensusResult> {
    // Calculate expertise weights for each expert
    const weights = await Promise.all(
      experts.map(expert => this.calculateExpertiseWeight(expert, proposal.domain))
    );
    
    // Collect weighted opinions
    const weightedOpinions = await Promise.all(
      experts.map(async (expert, index) => {
        const opinion = await expert.evaluateProposal(proposal);
        return {
          agent: expert.id,
          opinion: opinion,
          weight: weights[index],
          confidence: opinion.confidence
        };
      })
    );
    
    // Calculate weighted consensus
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const weightedScore = weightedOpinions.reduce((sum, wo) => 
      sum + (wo.opinion.score * wo.weight), 0
    ) / totalWeight;
    
    return {
      consensus: weightedScore > config.threshold,
      score: weightedScore,
      totalWeight,
      expertOpinions: weightedOpinions,
      confidence: this.calculateConfidence(weightedOpinions)
    };
  }
}
```

### Hierarchical Decision

Multi-level decision making with escalation capabilities.

- **Type**: `hierarchical`
- **Levels**: `['queen', 'coordinators', 'workers']`
- **Veto Rights**: `['queen']`
- **Escalation**: `true`

```typescript
interface HierarchicalLevel {
  name: string;
  agents: Agent[];
  authority: number;        // 0.0 - 1.0
  vetoRights: boolean;
  escalationThreshold: number;
}

class HierarchicalDecisionEngine {
  private hierarchy: HierarchicalLevel[];
  
  async makeHierarchicalDecision(
    proposal: Proposal,
    config: HierarchicalConfig
  ): Promise<HierarchicalDecisionResult> {
    let currentLevel = 0;
    let decision: Decision | null = null;
    
    while (currentLevel < this.hierarchy.length && !decision) {
      const level = this.hierarchy[currentLevel];
      
      try {
        // Attempt decision at current level
        const levelResult = await this.processAtLevel(proposal, level);
        
        if (levelResult.confident || currentLevel === this.hierarchy.length - 1) {
          decision = levelResult.decision;
        } else if (levelResult.needsEscalation) {
          this.logger.info(`Escalating decision from ${level.name} to next level`);
          currentLevel++;
        }
      } catch (error) {
        if (currentLevel < this.hierarchy.length - 1) {
          currentLevel++;
        } else {
          throw new HierarchicalDecisionError('All levels failed to reach decision');
        }
      }
    }
    
    // Apply veto rights if applicable
    if (decision && config.enableVetoRights) {
      decision = await this.applyVetoRights(decision, proposal);
    }
    
    return {
      decision: decision!,
      levelReached: currentLevel,
      escalated: currentLevel > 0,
      vetoApplied: decision !== decision
    };
  }
}

## 9. MCP Tool Definitions and Usage Patterns

This section details the MCP tool definitions and usage patterns for both Agent Framework and Hive Systems.

### Key MCP Tools

-   `mcp__claude-flow__swarm_init`: Setup swarm topology.
-   `mcp__claude-flow__agent_spawn`: Create agents.
-   `mcp__claude-flow__task_orchestrate`: Coordinate tasks.
-   `mcp__claude-flow__memory_usage`: Persistent memory operations.
-   `mcp__claude-flow__swarm_status`: Monitor swarm progress.

### MCP Protocol Bridge Architecture

The MCP Protocol Bridge provides seamless integration with external tools, enabling cross-protocol communication, enhanced routing, and unified tool management.

```
┌─────────────────────────────────────────────────────────────────┐
│                     MCP Protocol Bridge                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Tool Registry │  │ Protocol Router │  │ Load Balancer   │ │
│  │   (50+ Tools)   │  │ & Translator    │  │ & Failover      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Authentication  │  │ Rate Limiting   │  │ Monitoring &    │ │
│  │ & Authorization │  │ & Quotas        │  │ Observability   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Tool Registry

The MCP Bridge includes a comprehensive tool registry categorized by function.

#### Core System Tools (12)

```typescript
export const CORE_SYSTEM_TOOLS = {
  'system_status': 'Real-time system health monitoring',
  'resource_monitor': 'CPU, memory, and disk usage tracking',
  'process_manager': 'Process lifecycle management',
  'network_diagnostics': 'Network connectivity and performance analysis',
  'security_scanner': 'Vulnerability assessment and compliance checking',
  'backup_manager': 'Automated backup and restore operations',
  'log_aggregator': 'Centralized logging and analysis',
  'config_manager': 'Dynamic configuration management',
  'service_discovery': 'Automatic service registration and discovery',
  'health_checker': 'Endpoint health verification',
  'performance_profiler': 'Application performance analysis',
  'error_tracker': 'Exception monitoring and alerting'
};
```

#### Google Services Integration Tools (8)

```typescript
export const GOOGLE_SERVICES_TOOLS = {
  'streaming_api_connector': 'Real-time multimedia processing integration',
  'agentspace_manager': 'Collaborative workspace orchestration',
  'mariner_automation': 'Browser automation and testing',
  'veo3_video_generator': 'AI video content creation',
  'co_scientist_research': 'Scientific collaboration platform',
  'imagen4_image_generator': 'Advanced image generation',
  'chirp_audio_processor': 'Multilingual speech processing',
  'lyria_music_composer': 'AI music composition and arrangement'
};
```

#### Development & DevOps Tools (15)

```typescript
export const DEVELOPMENT_TOOLS = {
  'git_operations': 'Version control automation',
  'ci_cd_pipeline': 'Continuous integration and deployment',
  'docker_manager': 'Container orchestration and management',
  'kubernetes_operator': 'K8s cluster management and scaling',
  'terraform_provisioner': 'Infrastructure as code deployment',
  'code_analyzer': 'Static code analysis and quality metrics',
  'test_runner': 'Automated test execution and reporting',
  'dependency_scanner': 'Package vulnerability assessment',
  'api_tester': 'RESTful API testing and validation',
  'database_migrator': 'Schema migration and data management',
  'secret_manager': 'Secure credential management',
  'artifact_publisher': 'Build artifact distribution',
  'environment_provisioner': 'Development environment setup',
  'load_tester': 'Performance and stress testing',
  'documentation_generator': 'Automated API documentation'
};
```

#### Cloud & Infrastructure Tools (10)

```typescript
export const CLOUD_INFRASTRUCTURE_TOOLS = {
  'aws_ec2_manager': 'Amazon EC2 instance management',
  'gcp_compute_controller': 'Google Cloud Compute operations',
  'azure_vm_orchestrator': 'Microsoft Azure virtual machine management',
  'cloudflare_edge_manager': 'Edge computing and CDN management',
  'dns_manager': 'Domain name system configuration',
  'ssl_certificate_manager': 'TLS certificate lifecycle management',
  'storage_manager': 'Cloud storage operations and sync',
  'cdn_cache_controller': 'Content delivery network optimization',
  'firewall_configurator': 'Network security rule management',
  'vpn_connector': 'Virtual private network setup'
};
```

#### Data & Analytics Tools (10)

```typescript
export const DATA_ANALYTICS_TOOLS = {
  'database_connector': 'Multi-database query execution',
  'data_pipeline_orchestrator': 'ETL workflow management',
  'analytics_processor': 'Statistical analysis and reporting',
  'ml_model_deployer': 'Machine learning model deployment',
  'data_validator': 'Data quality and integrity checking',
  'schema_registry': 'Data schema management and evolution',
  'message_queue_manager': 'Event streaming and message processing',
  'cache_manager': 'Distributed caching operations',
  'search_indexer': 'Full-text search index management',
  'visualization_generator': 'Automated chart and graph creation'
};
```

### Protocol Translation Engine

```typescript
interface ProtocolTranslator {
  // MCP to A2A message translation
  translateMCPToA2A(mcpMessage: MCPMessage): A2AMessage;
  
  // A2A to MCP response translation
  translateA2AToMCP(a2aResponse: A2AResponse): MCPResponse;
  
  // Protocol-specific error handling
  handleProtocolError(error: ProtocolError): StandardError;
  
  // Message routing based on capabilities
  routeMessage(message: UniversalMessage): RoutingDecision;
}

class EnhancedProtocolTranslator implements ProtocolTranslator {
  private routingTable: Map<string, ProtocolEndpoint>;
  private capabilityMatcher: CapabilityMatcher;
  private loadBalancer: LoadBalancer;
  
  constructor(config: TranslationConfig) {
    this.routingTable = new Map();
    this.capabilityMatcher = new CapabilityMatcher(config.capabilities);
    this.loadBalancer = new LoadBalancer(config.loadBalancing);
  }
  
  translateMCPToA2A(mcpMessage: MCPMessage): A2AMessage {
    return {
      id: mcpMessage.id || generateMessageId(),
      method: this.mapMCPMethodToA2A(mcpMessage.method),
      params: this.transformMCPParams(mcpMessage.params),
      protocol: 'a2a',
      version: '2.0',
      metadata: {
        sourceProtocol: 'mcp',
        timestamp: Date.now(),
        routing: this.calculateRoutingInfo(mcpMessage)
      }
    };
  }
  
  translateA2AToMCP(a2aResponse: A2AResponse): MCPResponse {
    return {
      id: a2aResponse.id,
      result: this.transformA2AResult(a2aResponse.result),
      error: a2aResponse.error ? this.mapA2AErrorToMCP(a2aResponse.error) : undefined,
      metadata: {
        processed_by: 'gemini-flow-mcp-bridge',
        protocol_version: 'mcp-1.0',
        performance_metrics: a2aResponse.metadata?.performance
      }
    };
  }
}
```

### Enhanced Routing Configuration

```yaml
routing:
  strategies:
    - name: capability_based
      priority: 1
      matcher:
        type: capability
        rules:
          - capability: "google_services.*"
            target: google_services_cluster
          - capability: "system.*"
            target: system_tools_cluster
          - capability: "development.*"
            target: devops_cluster
    
    - name: load_balanced

## 10. Memory Management Patterns and Distributed Storage

This section details the memory management patterns, distributed storage solutions, and related operations for both Agent Framework and Hive Systems.

### Memory Operations

-   **Batch Operations**: Use batch operations for bulk memory updates.
-   **Memory operations**: ALWAYS batch ALL store/retrieve.

### Memory Architecture (SQLite Schema)

The system utilizes a robust memory architecture with a SQLite database for persistent context and efficient data access. The schema includes several tables for managing agents, swarms, tasks, memory, metrics, sessions, consensus decisions, neural patterns, workflows, hooks, configuration, and audit logs.

#### Key Tables for Memory and Neural Patterns

-   **Memory store table**: Stores key-value pairs with namespaces, agent/swarm IDs, and TTL.
    ```sql
    CREATE TABLE memory_store (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        namespace TEXT DEFAULT 'default',
        agent_id TEXT,
        swarm_id TEXT,
        ttl INTEGER, -- expiration timestamp
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        access_count INTEGER DEFAULT 0,
        UNIQUE(key, namespace)
    );
    ```
-   **Neural patterns table**: Stores neural weights and related data.
    ```sql
    CREATE TABLE neural_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_type TEXT NOT NULL,
        pattern_data TEXT NOT NULL, -- JSON neural weights
        accuracy REAL,
        training_iterations INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    ```

### Memory Operations Performance

The memory system is optimized for performance, leveraging SQLite WAL mode.

```typescript
interface MemoryPerformance {
  operations: {
    read: '8.7ms average',      // Target: <10ms ✓
    write: '12.3ms average',    // Target: <15ms ✓
    search: '45.2ms average',   // Target: <50ms ✓
    delete: '9.1ms average'     // Target: <10ms ✓
  },
  throughput: {
    reads: '115,000 ops/sec',
    writes: '81,000 ops/sec',
    mixed: '96,000 ops/sec'
  },
  capacity: {
    maxKeys: 'unlimited (disk bound)',
    maxValueSize: '1MB default',
    totalStorage: 'auto-expanding'
  }
}
```

### Memory Sharing Protocols

The system supports various memory sharing protocols for cross-agent communication.

```typescript
// Cross-agent memory sharing
interface MemorySharing {
  patterns: {
    broadcast: 'One-to-all memory updates',
    selective: 'Targeted memory sharing',
    hierarchical: 'Level-based access control',
    consensus: 'Validated memory updates'
  },
  synchronization: {
    immediate: 'Real-time sync (high overhead)',
    eventual: 'Eventually consistent (efficient)',
    periodic: 'Scheduled sync intervals',
    triggered: 'Event-based synchronization'
  },
  conflictResolution: {
    lastWrite: 'Last writer wins',
    vectorClock: 'Causal ordering',
    consensus: 'Group agreement required',
    merge: 'Automatic merge strategies'
  }
}
```

### Memory Commands

The `gemini-flow hive-mind memory` and `gemini-flow memory` commands provide comprehensive memory management capabilities.

#### Hive-Mind Memory Commands

```bash
# Manage memory
gemini-flow hive-mind memory <hiveId> [options]
  --store <key:value>  Store memory
  --retrieve <key>     Retrieve memory
  --list               List all memories
```

#### General Memory Commands

```bash
# Store memory
gemini-flow memory store <key> <value> [options]
  --namespace <name>   Namespace (default: default)
  --ttl <seconds>      Time to live
  --encrypt            Encrypt value

# Retrieve memory
gemini-flow memory retrieve <key> [options]
  --namespace <name>   Namespace (default: default)

# Query memory
gemini-flow memory query <pattern> [options]

## 12. Build & Test Commands

### Frontend
-   **Environment-Driven Build Analysis**: Use `"build:analyze": "ANALYZE=true next build"` to enable bundle analysis.
-   **Frontend Test Directory**: Frontend tests (e.g., Playwright) **must** be run from the `src/frontend/` directory.
-   **Ngrok Integration**: Responsive tests can integrate with Ngrok using `"test:responsive:ngrok": "NGROK_URL=$NGROK_URL ./tests/responsive/run-responsive-tests.sh pwa ngrok"`.
-   **Production Validation**: A dedicated shell script `./scripts/run-production-validation.sh` handles production validation.

### General
-   `npm run build/test/lint/typecheck`: Standard Node.js project commands.

---

## 13. Domain-Specific Logic: Fantasy Sports

The `the-fantasizer` project involves complex fantasy sports domain logic. Agents should be aware of:
-   **Kelly Criterion Implementation**: Used for optimal bankroll management.
-   **Multi-Entry Optimization**: Strategies for maximizing returns across multiple contest entries.
-   **Real-time Contest Monitoring**: Tracking live game data and player performance.
-   **Player Projections**: Integration with various data feeds for player performance predictions.

---

## 14. Further Reading

-   For detailed information on the agent system, swarm patterns, and MCP integration, refer to [`CLAUDE.md`](CLAUDE.md).
-   For comprehensive Google Services integration details, refer to [`GEMINI.md`](GEMINI.md).

  --namespace <name>   Namespace to search
  --limit <n>          Maximum results
```

---

      priority: 2
      matcher:
        type: round_robin
        health_check: true
        fallback: true
    
    - name: geographic
      priority: 3
      matcher:
        type: geographic
        rules:
          - region: us-east-1
            target: us_east_cluster
          - region: eu-west-1
            target: eu_west_cluster

  load_balancing:
    algorithm: weighted_round_robin
    weights:
      google_services_cluster: 40
      system_tools_cluster: 30
      devops_cluster: 20
      analytics_cluster: 10
    
    health_checks:
      interval: 30s
      timeout: 5s
      failure_threshold: 3
      success_threshold: 2
    
    circuit_breaker:
      failure_threshold: 5
      recovery_timeout: 60s
      half_open_requests: 3

authentication:
  methods:
    - oauth2
    - api_key
    - service_account
    - mutual_tls
  
  providers:
    google:
      client_id: ${GOOGLE_CLIENT_ID}
      client_secret: ${GOOGLE_CLIENT_SECRET}
      scopes: [cloud-platform, ai-platform]
    
    github:
      client_id: ${GITHUB_CLIENT_ID}
      client_secret: ${GITHUB_CLIENT_SECRET}
      scopes: [repo, user]

rate_limiting:
  global:
    requests_per_minute: 10000
    burst_capacity: 2000
    
  per_tool:
    google_services.*: 1000/min
    system.*: 5000/min
    development.*: 2000/min
    
  per_user:
    authenticated: 1000/min
    anonymous: 100/min

monitoring:
  metrics:
    - request_count
    - response_time
    - error_rate
    - throughput
    - resource_utilization
    
  alerting:
    high_error_rate:
      threshold: 5%
      duration: 5m
      severity: warning
    
    high_latency:
      threshold: 1000ms
      duration: 2m
      severity: critical
```

### Tool Integration Examples

```typescript
// Initialize MCP Bridge with Google Services
const mcpBridge = new MCPProtocolBridge({
  tools: {
    // Google Services tools
    streaming_api: new StreamingAPITool({
      endpoint: 'https://api.gemini-flow.dev/streaming',
      authentication: 'oauth2'
    }),
    
    agentspace: new AgentSpaceTool({
      endpoint: 'https://api.gemini-flow.dev/agentspace',
      capabilities: ['workspace_management', 'collaboration']
    }),
    
    // System tools
    system_monitor: new SystemMonitorTool({
      metrics: ['cpu', 'memory', 'disk', 'network'],
      interval: 30000
    }),
    
    // Development tools
    git_operations: new GitOperationsTool({
      providers: ['github', 'gitlab', 'bitbucket'],
      operations: ['clone', 'push', 'pull', 'merge', 'branch']
    })
  },
  
  routing: {
    strategy: 'capability_based',
    loadBalancing: true,
    circuitBreaker: true
  },
  
  security: {
    authentication: 'oauth2',
    authorization: 'rbac',
    encryption: 'tls_1_3'
  }
});

// Register tool with capability matching
await mcpBridge.registerTool('veo3_generator', {
  name: 'Veo3 Video Generator',
  capabilities: ['video_generation', 'content_creation', 'ai_processing'],
  endpoint: 'https://api.gemini-flow.dev/veo3',
  schema: {
    generate_video: {
      input: ['prompt', 'style', 'duration'],
      output: ['video_url', 'metadata']
    }
  }
});

// Execute tool with automatic routing
const result = await mcpBridge.executeMethod('veo3_generator.generate_video', {
  prompt: 'Cinematic mountain landscape at sunset',
  style: 'realistic',
  duration: 30
});
```

---

```

---

}

// 3. Consensus Pattern
class A2AConsensus {
  async requestConsensus(proposal: ConsensusProposal): Promise<ConsensusResult> {
    const participants = await this.getParticipants();
    const votes = await Promise.all(
      participants.map(p => p.vote(proposal))
    );
    
    return this.calculateConsensus(votes);
  }
}
```

### Cross-Protocol Translation

#### MCP to A2A Translation

```typescript
class MCPToA2ATranslator {
  translate(mcpMessage: MCPMessage): A2AMessage {
    return {
      id: mcpMessage.id || this.generateId(),
      method: this.mapMethod(mcpMessage.method),
      params: this.transformParams(mcpMessage.params),
      protocol: "a2a",
      version: "2.0",
      metadata: {
        timestamp: Date.now(),
        sender: this.getSenderFromMCP(mcpMessage),
        priority: this.mapPriority(mcpMessage.priority),
        routing: this.calculateRouting(mcpMessage),
        security: this.extractSecurity(mcpMessage),
        tracing: this.createTracing(mcpMessage)
      }
    };
  }
  
  private mapMethod(mcpMethod: string): string {
    const methodMapping = {
      'tools/list': 'registry.list_tools',
      'tools/call': 'tool.execute',
      'resources/list': 'resource.list',
      'resources/read': 'resource.read'
    };
    
    return methodMapping[mcpMethod] || mcpMethod;
  }
}
```

#### Protocol Bridge Example

```typescript
// Initialize protocol bridge
const protocolBridge = new A2AProtocolBridge({
  supportedProtocols: ['mcp', 'jsonrpc', 'grpc', 'websocket'],
  translation: {
    enableAutoTranslation: true,
    preserveMetadata: true,
    addTracing: true
  },
  routing: {
    defaultStrategy: RoutingStrategy.CAPABILITY,
    enableFallback: true,
    timeoutMs: 30000
  }
});

// Register translation rules
protocolBridge.addTranslationRule({
  from: 'mcp',
  to: 'a2a',
  transformer: new MCPToA2ATranslator()
});

// Handle incoming message
protocolBridge.on('message', async (message, sourceProtocol) => {
  const a2aMessage = await protocolBridge.translate(message, sourceProtocol, 'a2a');
  const response = await this.routeMessage(a2aMessage);
  return protocolBridge.translate(response, 'a2a', sourceProtocol);
});
```

---


This section details the various swarm coordination patterns and topologies used for managing distributed agent clusters.

### Agent Framework Swarm Topologies

Agent Framework defines several swarm topologies:

-   **Hierarchical**: Queen-led coordination for complex, multi-stage tasks.
-   **Mesh**: Peer-to-peer communication for distributed, fault-tolerant operations.
-   **Adaptive**: Dynamic topology adjustment based on task requirements and agent performance.

### Hive Systems Swarm Topologies

Hive Systems also supports various swarm topologies, configurable during initialization:

```bash
gemini-flow swarm init [options]
  --topology <type>    Topology: hierarchical|mesh|ring|star
  --max-agents <n>     Maximum agents (default: 8)
  --strategy <type>    Strategy: parallel|sequential|adaptive
```

### Hive Systems Collective Intelligence Patterns

Hive Systems implements several collective intelligence patterns for decision-making and memory sharing:

#### 1. Emergent Consensus

-   **Type**: `emergent`
-   **Threshold**: `0.7` (70% agreement required)
-   **Timeout**: `5000` ms
-   **Weights**: `performance` (Weight by agent performance)

#### 2. Democratic Voting

-   **Type**: `democratic`
-   **Majority**: `0.51` (Simple majority)
-   **Quorum**: `0.6` (60% participation required)
-   **Anonymous**: `false`

#### 3. Weighted Expertise

-   **Type**: `weighted`
-   **Factors**: `['experience', 'accuracy', 'specialization']`
-   **Minimum Weight**: `0.1`
-   **Normalization**: `true`

#### 4. Hierarchical Decision

-   **Type**: `hierarchical`
-   **Levels**: `['queen', 'coordinators', 'workers']`
-   **Veto Rights**: `['queen']`
-   **Escalation**: `true`

---

## 5. Memory Management

The system utilizes a robust memory architecture for persistent context and efficient data access.

### Key Principles
-   **Persistent Context**: Retain relevant context across development stages.
-   **Namespace Organization**: Use clear namespace hierarchies for memory keys.
-   **TTL Strategy**: Set appropriate expiration for temporary data.
-   **Batch Operations**: Use batch operations for bulk memory updates.
-   **SQLite WAL Mode**: Enabled for high-performance read/write operations.

### Memory Operations
-   `gemini-flow hive-mind memory --store <key:value>`: Store memory.
-   `gemini-flow hive-mind memory --retrieve <key>`: Retrieve memory.
-   `gemini-flow memory query <pattern>`: Query memory.
-   `gemini-flow memory clear --confirm`: Clear memory.

---

## 6. Build & Test Commands

### Frontend
-   **Environment-Driven Build Analysis**: Use `"build:analyze": "ANALYZE=true next build"` to enable bundle analysis.
-   **Frontend Test Directory**: Frontend tests (e.g., Playwright) **must** be run from the `src/frontend/` directory.
-   **Ngrok Integration**: Responsive tests can integrate with Ngrok using `"test:responsive:ngrok": "NGROK_URL=$NGROK_URL ./tests/responsive/run-responsive-tests.sh pwa ngrok"`.
-   **Production Validation**: A dedicated shell script `./scripts/run-production-validation.sh` handles production validation.

### General
-   `npm run build/test/lint/typecheck`: Standard Node.js project commands.

---

## 7. Domain-Specific Logic: Fantasy Sports

The `the-fantasizer` project involves complex fantasy sports domain logic. Agents should be aware of:
-   **Kelly Criterion Implementation**: Used for optimal bankroll management.
-   **Multi-Entry Optimization**: Strategies for maximizing returns across multiple contest entries.
-   **Real-time Contest Monitoring**: Tracking live game data and player performance.
-   **Player Projections**: Integration with various data feeds for player performance predictions.

---
