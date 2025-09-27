# Codex-Synaptic Self-Improvement Plan

## Overview

This document outlines the comprehensive self-improvement program for codex-synaptic, implementing a YAML-first semantic output schema to guide agentic orchestration. The focus is on modular architecture, enhanced swarm/consensus capabilities, TypeScript↔Python memory bridging, and structured system evolution.

## YAML-First Approach Rationale

### Why YAML over JSON for LLM Tool-Chaining

1. **Lower Syntactic Density**: Indentation-based structure reduces bracket misbalance errors
2. **Clearer Multi-Document Partitioning**: `---` separators enable chunk streaming  
3. **Reduced Token Noise**: Fewer delimiter tokens improve structural adherence
4. **Hierarchical Affordances**: Better visual structure for nested planning schemas
5. **Community Evidence**: Benchmarks show fewer structural violations in YAML vs JSON for >5 nested sections

### Implementation Strategy

- **Primary Output**: All agent deliverables MUST emit YAML conforming to SCHEMA_MASTER.yaml
- **Feedforward Filter**: Automatic YAML→JSON conversion when endpoints don't support YAML
- **Detection Mechanism**: Check headers, parsing capabilities, and tool metadata
- **Fallback Safety**: Lossless conversion preserving semantic meaning

## Architecture Modularization Plan

### Current State
The system currently uses a monolithic `CodexSynapticSystem` class that handles:
- Agent orchestration
- Neural mesh coordination  
- Swarm optimization
- Consensus management
- Resource management
- Bridge communications

### Target Modular Architecture

```
core/
├── orchestrator.ts      # Main coordination facade
├── scheduler.ts         # Task scheduling and dispatch
└── health.ts           # System health monitoring

mesh/
├── topology.ts         # Neural mesh structure management
├── routing.ts          # Message routing and discovery
└── protocols.ts        # Communication protocols

swarm/
├── engine.ts           # Swarm coordination core
├── algorithms/         # PSO, ACO, flocking implementations
└── optimization.ts     # Objective function management

consensus/
├── manager.ts          # Consensus protocol coordination
├── raft.ts            # RAFT implementation
└── byzantine.ts        # BFT implementation

memory/
├── bridge.ts          # TS↔Python memory bridge
├── persistence.ts     # Local SQLite management
└── vectorstore.ts     # Integration with Python ChromaDB

telemetry/
├── bus.ts             # Event collection and routing
├── metrics.ts         # Performance and health metrics
└── exporters.ts       # External telemetry systems

security/
├── guard.ts           # Security policy enforcement
├── auth.ts            # Authentication and authorization
└── validation.ts      # Input validation and sanitization
```

### Migration Benefits

- **Reduced Coupling**: Clear module boundaries
- **Test Isolation**: Independent testing of components
- **Parallel Development**: Teams can work on separate modules
- **Easier Maintenance**: Focused responsibility areas
- **Better Documentation**: Module-specific documentation

## Memory Bridge Specification

### Interface Contract

The TS↔Python memory bridge provides seamless integration between:
- TypeScript SQLite-based local storage
- Python ChromaDB vector database

### Core Methods

#### `putMemory(namespace, text, id?, metadata?)`
- Stores textual memory with optional vectorization
- Returns: `{id: string, vectorized: boolean}`
- Errors: `RETRYABLE`, `NON_RETRYABLE`

#### `semanticQuery(namespace, query, k?)`
- Performs semantic search across stored memories
- Returns: `{results: MemoryHit[]}`
- Uses vector similarity for ranking

#### `reconcile(strategy)`
- Resolves divergence between TS and Python stores
- Strategies: `ts-wins`, `py-wins`, `merge`
- Returns: `{actions: Action[]}`

## Testing Strategy

### Coverage Goals
- **Statements**: 75%
- **Branches**: 65%

### Test Layers

#### Unit Testing
- **Framework**: Vitest (already configured)
- **Focus**: Individual module functionality
- **Mocking**: External dependencies and system resources

#### Integration Testing  
- **Environment**: Ephemeral SQLite databases
- **Focus**: Module interaction and data flow
- **Scenarios**: Agent coordination, bridge communication

#### Scenario Testing
- **Focus**: Complex workflows and edge cases
- **Examples**: Mesh reconfiguration, consensus quorum variance
- **Environment**: Full system simulation

#### Regression Testing
- **Trigger**: Release candidate tags
- **Scope**: Critical path validation
- **Automation**: CI/CD pipeline integration

## Telemetry Schema

### Event Types

#### Agent Lifecycle Events
- Fields: `agentId`, `type`, `state_from`, `state_to`, `timestamp`
- Purpose: Track agent state transitions

#### Swarm Iteration Events  
- Fields: `swarmId`, `algorithm`, `iteration`, `convergenceScore`, `bestFitness`, `timestamp`
- Purpose: Monitor optimization progress

### Metrics

#### Gauges
- `agent.active`: Current active agent count
- `mesh.node.count`: Neural mesh node count

#### Counters
- `task.completed`: Total completed tasks
- `task.failed`: Total failed tasks  
- `security.violations`: Security policy violations

#### Histograms
- `consensus.decision_time_ms`: Consensus decision latency
- `swarm.convergence_iterations`: Iterations to convergence

## Security & Governance

### Threat Model

#### T1: Arbitrary Task Execution
- **Risk**: Malicious code execution through task system
- **Mitigation**: Task allowlist, sandbox policy enforcement

#### T2: Resource Exhaustion
- **Risk**: System DoS through resource consumption
- **Mitigation**: Iteration caps, CPU/memory quotas

#### T3: Data Injection
- **Risk**: Malicious data corruption through bridges
- **Mitigation**: Input validation, schema enforcement

#### T4: Privilege Escalation
- **Risk**: Unauthorized access to system capabilities
- **Mitigation**: RBAC implementation, capability restrictions

#### T5: Network Attacks
- **Risk**: Mesh network compromise or disruption
- **Mitigation**: Certificate-based auth, encrypted communications

### Governance Policies

- **Task Command Length**: Maximum 4096 characters
- **Topology Node Limit**: Maximum 256 nodes
- **Resource Quotas**: Per-agent memory and CPU limits
- **Audit Requirements**: All consensus decisions logged

## Release Automation

### Semantic Versioning Rules

#### Major Version Triggers
- Breaking CLI changes
- Memory schema changes
- Incompatible API modifications

#### Minor Version Triggers
- New algorithms or capabilities
- Additive command features
- New bridge protocols

#### Patch Version Triggers
- Bug fixes
- Performance optimizations
- Documentation updates

### Changelog Automation

Sections: **Added**, **Changed**, **Fixed**, **Security**

### CI/CD Pipeline
- Automated testing on PR
- Security scanning
- Performance benchmarking
- Documentation generation

## Implementation Phases

### Sprint 1: Foundation
- **Goals**: Module boundaries, memory bridge spec, telemetry schema
- **Deliverables**: Architecture refactor plan, initial telemetry events
- **Exit Criteria**: Backlog items B1-B5 accepted

### Sprint 2: Core Implementation  
- **Goals**: Bridge adapter, telemetry emitters, threat model
- **Deliverables**: Working memory bridge, security baseline
- **Exit Criteria**: Memory sync integration test passes

### Sprint 3: Integration & Automation
- **Goals**: Swarm refinement, documentation, release automation
- **Deliverables**: Complete docs tree, CI/CD pipeline
- **Exit Criteria**: Semantic versioning gate active

## Success Metrics

- **Architecture**: Clear module boundaries with <20% coupling
- **Memory Bridge**: <100ms query latency, 99.9% consistency
- **Telemetry**: Complete event coverage, <1% overhead
- **Security**: Zero critical vulnerabilities, audit compliance
- **Testing**: >75% coverage, <5% flaky tests
- **Documentation**: Complete API docs, user guides
- **Release**: Automated deployment, <30min cycle time