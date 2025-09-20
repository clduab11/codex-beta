<div align="center">

# 🧠 Codex-Synaptic

[![GitHub stars](https://img.shields.io/github/stars/clduab11/codex-synaptic.svg?style=social&label=Star&maxAge=2592000)](https://GitHub.com/clduab11/codex-synaptic/stargazers/)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)

**Advanced Distributed AI Agent Orchestration System**

<img width="2560" height="1440" alt="VeniceAI_WHENURo_@2x" src="https://github.com/user-attachments/assets/4e6bb1a5-41e4-4adb-8c37-86da5658fc7d" />

*Neural Mesh Networking • Swarm Intelligence • Consensus Mechanisms*

</div>

## ⚡ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=clduab11/codex-synaptic&type=Date)](https://star-history.com/#clduab11/codex-synaptic&Date)

---

## 🚀 Overview

**Codex-Synaptic** is a next-generation distributed AI system that creates intelligent agent networks through neural mesh architectures. Like synapses connecting neurons in the brain, our system enables seamless communication and coordination between AI agents, resulting in emergent collective intelligence.

### 🎯 Core Philosophy

Just as biological neural networks exhibit emergent intelligence through synaptic connections, Codex-Synaptic orchestrates AI agents in interconnected meshes that demonstrate collective problem-solving capabilities beyond individual agent capacity.

### ✨ Key Features

- **🧠 Neural Mesh Networks**: Self-organizing, fault-tolerant agent interconnections
- **🐝 Swarm Intelligence**: PSO, ACO, and flocking algorithms for collective optimization
- **🗳️ Consensus Mechanisms**: Byzantine fault tolerance, RAFT, and democratic decision-making
- **🔗 Protocol Bridging**: MCP (Model Control Protocol) and A2A (Agent-to-Agent) communication
- **⚡ GPU Acceleration**: Auto-detection for CUDA and Apple Metal (MPS) backends
- **🛡️ Enterprise Security**: Role-based authentication, circuit breakers, and resource governance
- **📊 Real-time Telemetry**: Memory monitoring, performance metrics, and health dashboards
- **🎛️ CLI + Daemon**: Interactive command-line interface with background orchestration

---

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [CLI Usage](#-cli-usage)
- [API Documentation](#-api-documentation)
- [Examples](#-examples)
- [Configuration](#-configuration)
- [Development](#-development)
- [Contributing](#-contributing)
- [Changelog](#-changelog)
- [License](#-license)

---

## 🛠 Installation

### Prerequisites

- **Node.js** 16+ 
- **npm** or **yarn**
- **TypeScript** 4.5+
- **Python** 3.8+ (for ML components)

### Install Dependencies

```bash
git clone https://github.com/clduab11/codex-synaptic.git
cd codex-synaptic
npm install  # Compiles TypeScript and installs dependencies
```

### Global CLI Installation

```bash
npm link
# Now you can use 'codex-synaptic' command globally
```

---

## 🚀 Quick Start

### 1. Initialize the System

```bash
# Start the Synaptic system
npm run dev

# Or using CLI directly
codex-synaptic system start
```

### 2. Monitor System Status

```bash
# Check system health and telemetry
codex-synaptic system status

# Stream real-time metrics
codex-synaptic system monitor --interval 2000
```

### 3. Deploy Agent Network

```bash
# Deploy specialized agents
codex-synaptic agent deploy --type code_worker --replicas 3
codex-synaptic agent deploy --type data_worker --replicas 2
codex-synaptic agent deploy --type validation_worker --replicas 1
```

### 4. Create Neural Mesh

```bash
# Initialize interconnected agent mesh
codex-synaptic mesh create --nodes 10 --topology mesh

# Monitor mesh topology
codex-synaptic mesh status
```

### 5. Start Swarm Intelligence

```bash
# Particle Swarm Optimization
codex-synaptic swarm start --algorithm pso --agents worker:5,coordinator:2

# Ant Colony Optimization
codex-synaptic swarm start --algorithm aco --agents worker:8,coordinator:1

# Flocking behavior
codex-synaptic swarm start --algorithm flocking --agents worker:6,coordinator:2
```

### 6. Execute Intelligent Workflows

```bash
# Natural language task execution
codex-synaptic hive-mind spawn "Create a TypeScript REST API with authentication and database integration" --agents 7 --algorithm pso --fault-tolerance

# Data analysis workflow
codex-synaptic hive-mind spawn "Analyze customer feedback and generate sentiment reports" --agents 4 --algorithm aco --auto-scale

# Full-stack development
codex-synaptic hive-mind spawn "Build a React dashboard with real-time data visualization" \
  --agents 10 \
  --algorithm flocking \
  --priority 8 \
  --timeout 600 \
  --mesh-topology hierarchical \
  --consensus byzantine \
  --debug
```

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                 Codex-Synaptic System                   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Neural    │  │    Swarm    │  │  Consensus  │     │
│  │    Mesh     │  │Intelligence │  │   Engine    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │    Agent    │  │    Task     │  │ Resource    │     │
│  │  Registry   │  │ Scheduler   │  │  Manager    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ MCP Bridge  │  │ A2A Bridge  │  │   Security  │     │
│  │             │  │             │  │    Layer    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Agent Types

- **🔧 CodeWorker**: Code generation, analysis, and refactoring
- **📊 DataWorker**: Data processing, transformation, and analysis  
- **✅ ValidationWorker**: Code validation, testing, and quality assurance
- **🎯 SwarmCoordinator**: Multi-agent task distribution and synchronization
- **🗳️ ConsensusCoordinator**: Distributed decision making and agreement protocols
- **🕸️ TopologyCoordinator**: Neural mesh structure management and optimization

### Intelligence Algorithms

- **🌊 Particle Swarm Optimization (PSO)**: Continuous optimization and parameter tuning
- **🐜 Ant Colony Optimization (ACO)**: Discrete optimization and pathfinding
- **🐦 Flocking Algorithms**: Collective movement and spatial coordination
- **⛓️ RAFT Consensus**: Leader-based consensus for state replication
- **🛡️ Byzantine Fault Tolerance**: Handling malicious or faulty agents

---

## 💻 CLI Usage

### System Commands

```bash
codex-synaptic system start           # Initialize the system
codex-synaptic system status          # Show system health
codex-synaptic system monitor         # Real-time telemetry
codex-synaptic system stop            # Shutdown system
```

### Agent Management

```bash
codex-synaptic agent list                           # List all agents
codex-synaptic agent deploy --type <type> --replicas <n>  # Deploy agents
codex-synaptic agent status <agent-id>              # Agent details
codex-synaptic agent remove <agent-id>              # Remove agent
```

### Neural Mesh Operations

```bash
codex-synaptic mesh create --nodes <n> --topology <type>  # Create mesh
codex-synaptic mesh status                              # Mesh topology
codex-synaptic mesh optimize                            # Optimize connections
codex-synaptic mesh visualize                           # Generate topology graph
```

### Swarm Intelligence

```bash
codex-synaptic swarm start --algorithm <type>       # Start swarm
codex-synaptic swarm status                         # Swarm metrics
codex-synaptic swarm configure --params <json>      # Configure parameters
codex-synaptic swarm stop                           # Stop swarm
```

### Consensus & Governance

```bash
codex-synaptic consensus propose <type> <data>      # Create proposal
codex-synaptic consensus vote <id> <yes|no>         # Vote on proposal
codex-synaptic consensus list                       # Active proposals
codex-synaptic consensus history                    # Decision history
```

---

## 📚 API Documentation

### CodexSynapticSystem

```typescript
class CodexSynapticSystem extends EventEmitter {
  async initialize(): Promise<void>
  async shutdown(): Promise<void>
  
  // Core components
  getAgentRegistry(): AgentRegistry
  getNeuralMesh(): NeuralMesh
  getSwarmCoordinator(): SwarmCoordinator
  getConsensusManager(): ConsensusManager
  
  // Operations
  async deployAgent(type: AgentType, count: number): Promise<void>
  async createNeuralMesh(topology: string, nodes: number): Promise<void>
  async startSwarm(algorithm: string, objectives?: string[]): Promise<void>
  async executeTask(prompt: string): Promise<WorkflowResult>
}
```

### Event System

```typescript
system.on('agentRegistered', (agent) => { /* handle */ });
system.on('meshTopologyUpdated', (topology) => { /* handle */ });
system.on('swarmOptimized', (metrics) => { /* handle */ });
system.on('consensusReached', (decision) => { /* handle */ });
```

---

## 📁 Examples

### Basic Agent Deployment

```typescript
import { CodexSynapticSystem, AgentType } from 'codex-synaptic';

const system = new CodexSynapticSystem();
await system.initialize();

// Deploy intelligent agents
await system.deployAgent(AgentType.CODE_WORKER, 3);
await system.deployAgent(AgentType.DATA_WORKER, 2);

// Create neural mesh network
await system.createNeuralMesh('hierarchical', 10);

// Start swarm intelligence
await system.startSwarm('pso', ['performance', 'reliability']);
```

### Advanced Workflow Orchestration

```typescript
// Execute complex multi-stage workflow
const result = await system.executeTask(`
  Create a microservices architecture with:
  - Authentication service (JWT)
  - User management API
  - Real-time notification system
  - Database integration (PostgreSQL)
  - Docker containerization
  - Kubernetes deployment manifests
`);

console.log('Generated artifacts:', result.artifacts);
console.log('Mesh topology:', result.mesh);
console.log('Swarm optimization:', result.swarm);
```

---

## ⚙️ Configuration

### System Configuration (`config/system.json`)

```json
{
  "system": {
    "logLevel": "info",
    "maxAgents": 100,
    "taskTimeout": 300000
  },
  "mesh": {
    "topology": "hierarchical",
    "maxConnections": 10,
    "updateInterval": 5000,
    "maxRunDurationMs": 3600000
  },
  "swarm": {
    "defaultAlgorithm": "pso",
    "maxIterations": 1000,
    "convergenceThreshold": 0.01
  },
  "consensus": {
    "mechanism": "byzantine",
    "timeout": 10000,
    "faultTolerance": 0.33
  }
}
```

### Environment Variables

```bash
CODEX_SYNAPTIC_LOG_LEVEL=debug
CODEX_SYNAPTIC_MAX_AGENTS=50
CODEX_SYNAPTIC_CONFIG_PATH=./custom-config.json
CODEX_GPU_ACCELERATION=true
```

---

## 🔧 Development

### Build System

```bash
npm run build      # Compile TypeScript
npm run dev        # Development mode with hot reload
npm run test       # Run test suite
npm run lint       # ESLint analysis
npm run format     # Prettier formatting
```

### Project Structure

```
codex-synaptic/
├── src/
│   ├── core/          # Core system components
│   ├── agents/        # Agent implementations
│   ├── mesh/          # Neural mesh networking
│   ├── swarm/         # Swarm intelligence algorithms
│   ├── consensus/     # Consensus mechanisms
│   ├── bridging/      # Protocol bridges (MCP/A2A)
│   └── cli/           # Command-line interface
├── examples/          # Usage examples
├── tests/             # Test suites
├── docs/              # Documentation
└── config/            # Configuration files
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:agents
npm run test:mesh
npm run test:swarm
npm run test:consensus

# Generate coverage report
npm run test:coverage
```

---

## 🤝 Contributing

We welcome contributions to Codex-Synaptic! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/synaptic-enhancement`
3. Make your changes with tests
4. Commit: `git commit -m 'Add synaptic feature'`
5. Push: `git push origin feature/synaptic-enhancement`
6. Open a Pull Request

---

## 📖 Documentation

- **[Architecture Guide](./docs/ARCHITECTURE.md)**: System design and component details
- **[Agent Development](./docs/AGENTS.md)**: Creating custom agents
- **[API Reference](./docs/API.md)**: Complete API documentation
- **[Deployment Guide](./docs/DEPLOYMENT.md)**: Production deployment
- **[Performance Tuning](./docs/PERFORMANCE.md)**: Optimization strategies

---

## 🎯 Roadmap

- **v1.1**: Enhanced GPU cluster support
- **v1.2**: Web-based monitoring dashboard  
- **v1.3**: Kubernetes operator
- **v1.4**: Multi-cloud orchestration
- **v2.0**: Quantum-classical hybrid processing

---

## 🌟 Acknowledgments

- **Parallax Analytics Team**: Core development and research
- **OpenAI**: Foundational AI/ML technologies
- **TypeScript & Node.js Communities**: Excellent tooling ecosystem
- **Distributed Systems Research**: Academic foundations
- **Open Source Contributors**: Community enhancements and feedback

---

## 📄 License

Copyright (c) 2025 **Parallax Analytics**

Licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 📞 Support & Contact

- **🌐 Website**: [parallaxanalytics.io](https://parallaxanalytics.io)
- **📧 Email**: [support@parallaxanalytics.io](mailto:support@parallaxanalytics.io)
- **💬 Discussions**: [GitHub Discussions](https://github.com/clduab11/codex-synaptic/discussions)
- **🐛 Issues**: [GitHub Issues](https://github.com/clduab11/codex-synaptic/issues)
- **📖 Documentation**: [docs.parallaxanalytics.io](https://docs.parallaxanalytics.io)

---

<div align="center">

**Built with ❤️ by Parallax Analytics for the future of distributed AI**

[![Parallax Analytics](https://img.shields.io/badge/Parallax-Analytics-blue?style=for-the-badge)](https://parallaxanalytics.io)

</div>

````

### Key Features

- **🤖 Multi-Agent System**: Deploy specialized agents (code, data, validation, coordinators, bridges) with shared lifecycle management
- **🧠 Workflow Orchestrator**: Prompt-aware pipeline builder that chains analysis, generation, linting, validation, and summarisation across the fleet
- **🔐 Authentication & Access Control**: Role-based permissions, token lifecycle management, and middleware guardrails baked into the core system
- **📈 Resource Governance**: Memory/CPU tracking, rate limiting, auto-scaling hints, and circuit breakers to protect long-running sessions
- **🕸️ Neural Mesh**: Self-organising interconnected agent networks with topology-aware routing
- **🐝 Swarm Coordination**: PSO, ACO, and flocking algorithms for collective intelligence plus adaptive telemetry hooks
- **🗳️ Consensus Mechanisms**: Byzantine fault tolerance, RAFT, and weighted expertise flows for decisioning
- **🌉 Bridging**: MCP (Model Control Protocol) and A2A (Agent-to-Agent) integration with dedicated bridge agents
- **⚡ GPU Acceleration**: Auto-detects CUDA and Apple Metal (MPS) backends, exposing device metadata and environment hints to downstream tooling
- **🧩 Polyglot & ML Stack**: Node.js orchestration works alongside Python notebooks and services (PyTorch, scikit-learn, XGBoost) for model-heavy workflows
- **🖥️ CLI + Daemon Mode**: Rich CLI session manager, background daemon tooling, live telemetry, and workflow execution helpers
- **🗄️ Persistent Storage & Artifacts**: Structured storage/logging pipeline for workflow outputs, repository scans, and audit trails

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [CLI Usage](#cli-usage)
- [API Documentation](#api-documentation)
- [Examples](#examples)
- [Configuration](#configuration)
- [Contributing](#contributing)

## 🛠 Installation

### Prerequisites

- Node.js 16+ 
- npm or yarn
- TypeScript 4.5+

### Install Dependencies

```bash
git clone https://github.com/clduab11/codex-beta.git
cd codex-beta
npm install  # installs dependencies and compiles the TypeScript sources
```

### Global CLI Installation (Optional)

```bash
npm link
# Now you can use 'codex-beta' command globally
```

## 🚀 Quick Start

### 1. Start the System

```bash
# Using npm script
npm run dev

# Or using CLI directly
codex-beta system start
```

Kick-off commands automatically initialise authentication, resource monitors, storage, and telemetry. The CLI keeps a singleton `CodexBetaSystem` alive per process so repeated commands are instant.

### 2. Use the CLI session manager

```bash
# Inspect live status and telemetry
codex-beta system status

# Stream telemetry until interrupted
codex-beta system monitor --interval 2000

# Inspect the last few tasks in this session
codex-beta task recent
```

### 3. (Optional) Run the background daemon

```bash
# Launch a detached system managed via state file ~/.codex-beta/daemon.json
codex-beta background start

# Inspect daemon health
codex-beta background status

# Stop the daemon
codex-beta background stop
```

### 4. Deploy Agents

```bash
# Deploy code generation workers
codex-beta agent deploy --type code_worker --replicas 3

# Deploy data processing workers  
codex-beta agent deploy --type data_worker --replicas 2

# Deploy validation workers
codex-beta agent deploy --type validation_worker --replicas 1
```

### 5. Create Neural Mesh

```bash
# Create interconnected mesh network
codex-beta mesh create --nodes 10 --topology mesh

# Check mesh status
codex-beta mesh status
```

### 6. Start Swarm Coordination

```bash
# Start PSO (Particle Swarm Optimization) 
codex-beta swarm start --algorithm pso --agents worker:5,coordinator:2

# Start ACO (Ant Colony Optimization)
codex-beta swarm start --algorithm aco --agents worker:8,coordinator:1
```

### 7. Hive-Mind Coordination

```bash
# Spawn a hive-mind for complex tasks with natural language
codex-beta hive-mind spawn "Create a TypeScript REST API with authentication and database integration" --agents 7 --algorithm pso --fault-tolerance --debug

# Spawn a data analysis hive-mind
codex-beta hive-mind spawn "Analyze customer feedback and generate sentiment reports" --agents 4 --algorithm aco --auto-scale

# Advanced hive-mind with custom configuration
codex-beta hive-mind spawn "Build a React dashboard with real-time data visualization" \
  --agents 10 \
  --algorithm flocking \
  --priority 8 \
  --timeout 600 \
  --mesh-topology hierarchical \
  --consensus byzantine \
  --auto-scale \
  --fault-tolerance \
  --debug

# Check hive-mind status
codex-beta hive-mind status

# Terminate all hive-minds
codex-beta hive-mind terminate --force
```

### 8. Submit Tasks

### 9. Run the test suite

```bash
npm run test        # executes Vitest in run mode
npm run test:watch  # interactive watcher for local development
```

## ✨ Latest Enhancements

- **Security & Auth**: First-class authentication manager, role-based access, password hashing, and token lifecycle housekeeping.
- **Resilience Controls**: Circuit breakers, retry manager, and structured error taxonomy that surfaces actionable error codes.
- **Resource Stewardship**: Memory/CPU metering, rate limiting, and auto-scaler hints gate task execution to protect throughput.
- **Persistent Telemetry**: Storage manager plus structured logs per component under `logs/`, enabling replayable workflow artifacts.
- **CLI Evolution**: Session-aware CLI, background daemon management, workflow telemetry streaming, and richer task inspection.
- **Testing & Tooling**: Vitest-based suites for CLI, configuration, and swarm logic, with ESLint flat config and optional JUnit output for CI.
- **Health & Telemetry**: RSS-based memory watchdog with hysteresis surfaces `memoryStatus` in telemetry and renders headroom in the CLI.
- **Runtime Governance**: Neural mesh and swarm orchestrations auto-stop at configurable 60 minute ceilings with timeout events and countdowns.
- **Agent Reliability**: Idle agents publish synthetic heartbeats so the registry avoids false "missed heartbeat" warnings during long pauses.
- **GPU Manager**: Cross-platform detection for CUDA and Apple Metal (MPS) with memoized probes, environment priming, and telemetry surfacing.

```bash
# Submit a code generation task
codex-beta task submit code_generation --priority 5 --data '{
  "language": "typescript",
  "description": "Create REST API for user management",
  "requirements": ["authentication", "validation", "testing"]
}'

# List all tasks
codex-beta task list
```

## 🏗 Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                 Codex-Beta System                       │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │    Agent    │  │    Task     │  │ Configuration│     │
│  │  Registry   │  │ Scheduler   │  │   Manager    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Neural    │  │    Swarm    │  │  Consensus  │     │
│  │    Mesh     │  │ Coordinator │  │   Manager   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ MCP Bridge  │  │ A2A Bridge  │  │   Logger    │     │
│  │             │  │             │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Project Layout Highlights

- Frontend migration remains nested under `src/frontend/src/frontend/`, so React bundles live alongside the legacy shell.
- Secrets for local and container deployments are sourced from mounted files to avoid depending on external vaults.
- Node.js services interoperate with Python ML tooling (PyTorch, scikit-learn, XGBoost) to cover data science workloads without leaving the workspace.
- Neural mesh and swarm orchestrators enforce 60-minute ceilings and emit timeout events that surface in CLI telemetry.
- Agent registry emits synthetic idle heartbeats, aligning the 90 s liveness guard with long-running CLIs.
- Telemetry streams now include `memoryStatus` (RSS, limit, headroom) so the CLI can warn before exhausting resource budgets.
- GPU detection memoizes `nvidia-smi`/`system_profiler` probes so repeat CLI sessions reuse cached device metadata.

### Agent Types

- **CodeWorker**: Code generation, analysis, and refactoring
- **DataWorker**: Data processing, transformation, and analysis  
- **ValidationWorker**: Code validation, testing, and quality assurance
- **SwarmCoordinator**: Multi-agent task distribution and synchronization
- **ConsensusCoordinator**: Distributed decision making and agreement protocols
- **TopologyCoordinator**: Network structure management and optimization

### Algorithms Implemented

- **Particle Swarm Optimization (PSO)**: Continuous optimization problems
- **Ant Colony Optimization (ACO)**: Discrete optimization and path-finding
- **Flocking Algorithms**: Collective movement and spatial coordination
- **RAFT Consensus**: Leader-based consensus for state replication
- **Byzantine Fault Tolerance**: Handling malicious or faulty agents

## 💻 CLI Usage

### System Commands

```bash
codex-beta system start           # Start the system
codex-beta system status          # Show system status
codex-beta system stop            # Stop the system
```

### Agent Management

```bash
codex-beta agent list                              # List all agents
codex-beta agent deploy --type <type> --replicas <n>  # Deploy agents
codex-beta agent remove <agent-id>                 # Remove specific agent
codex-beta agent status <agent-id>                 # Show agent status
```

### Neural Mesh

```bash
codex-beta mesh create --nodes <n> --topology <type>  # Create mesh
codex-beta mesh status                              # Show mesh status
codex-beta mesh optimize                            # Optimize topology
```

### Swarm Coordination

```bash
codex-beta swarm start --algorithm <type>          # Start swarm
codex-beta swarm stop                               # Stop swarm
codex-beta swarm status                             # Show swarm status
codex-beta swarm configure --params <json>         # Configure parameters
```

### Consensus & Governance

```bash
codex-beta consensus propose <type> <data>         # Create proposal
codex-beta consensus vote <proposal-id> <yes|no>   # Vote on proposal
codex-beta consensus list                           # List active proposals
```

### Interactive Mode

```bash
codex-beta interactive    # Start interactive CLI mode
codex-beta i             # Short form
```

## 📚 API Documentation

### Core Classes

#### CodexBetaSystem

```typescript
class CodexBetaSystem extends EventEmitter {
  async initialize(): Promise<void>
  async shutdown(): Promise<void>
  getAgentRegistry(): AgentRegistry
  getTaskScheduler(): TaskScheduler
  getNeuralMesh(): NeuralMesh
  getSwarmCoordinator(): SwarmCoordinator
  getConsensusManager(): ConsensusManager
}
```

#### AgentRegistry

```typescript
class AgentRegistry extends EventEmitter {
  registerAgent(metadata: AgentMetadata): void
  unregisterAgent(agentId: AgentId): void
  getAgent(agentId: AgentId): AgentMetadata | undefined
  getAgentsByType(type: AgentType): AgentMetadata[]
  getAvailableAgents(): AgentId[]
}
```

#### TaskScheduler

```typescript
class TaskScheduler extends EventEmitter {
  submitTask(task: TaskSubmission): Task
  getTask(taskId: string): Task | undefined
  getTasksByStatus(status: TaskStatus): Task[]
}
```

### Event System

The system uses EventEmitter for component communication:

```typescript
system.on('agentRegistered', (agent) => { /* handle */ });
system.on('taskCompleted', (task) => { /* handle */ });
system.on('consensusReached', (proposal) => { /* handle */ });
```

## 📁 Examples

Check out the [`examples/`](./examples/) directory for detailed usage examples:

- **Basic Setup**: Simple system initialization and usage
- **Swarm Optimization**: PSO and ACO algorithm demonstrations  
- **Consensus Voting**: Distributed decision making examples
- **Neural Mesh**: Self-organizing network examples
- **MCP Bridging**: External model integration
- **CLI Workflows**: Command-line usage patterns

### Running Examples

```bash
# Run basic setup example
node examples/basic-setup.js

# Run CLI workflow examples
chmod +x examples/cli-workflows.sh
./examples/cli-workflows.sh
```

## ⚙️ Configuration

### System Configuration

Configuration is managed through `config/system.json`:

```json
{
  "system": {
    "logLevel": "info",
    "maxAgents": 100,
    "heartbeatInterval": 30000,
    "taskTimeout": 300000
  },
  "mesh": {
    "maxConnections": 10,
    "updateInterval": 5000,
    "topology": "mesh",
    "maxRunDurationMs": 3600000
  },
  "swarm": {
    "defaultAlgorithm": "pso",
    "maxIterations": 1000,
    "convergenceThreshold": 0.01,
    "maxRunDurationMs": 3600000
  },
  "consensus": {
    "mechanism": "raft",
    "timeout": 10000
  },
  "gpu": {
    "probeCacheTtlMs": 300000,
    "disableProbeCache": false
  }
}
```

- `mesh.maxRunDurationMs` and `swarm.maxRunDurationMs` cap long-running orchestration loops (default 60 minutes) and emit timeout telemetry when exceeded.
- `gpu.probeCacheTtlMs` caches hardware probes for repeated CLI invocations, while `gpu.disableProbeCache` forces a fresh scan when needed.
- Telemetry now includes a `memoryStatus` payload (RSS usage, limit, and headroom) surfaced directly in `codex-beta system status` output.

### Environment Variables

```bash
CODEX_BETA_LOG_LEVEL=debug
CODEX_BETA_MAX_AGENTS=50
CODEX_BETA_CONFIG_PATH=./custom-config.json
CODEX_GPU_PROBE_DISABLE_CACHE=1
```


## 🔧 Development

### Build System

```bash
npm run build      # Compile TypeScript
npm run dev        # Development mode with hot reload
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Project Structure

```
codex-beta/
├── src/
│   ├── core/          # Core system components
│   ├── agents/        # Agent management
│   ├── mesh/          # Neural mesh implementation
│   ├── swarm/         # Swarm coordination
│   ├── consensus/     # Consensus mechanisms
│   ├── bridging/      # MCP/A2A bridges
│   └── cli/           # Command-line interface
├── examples/          # Usage examples
├── docs/              # Documentation
└── config/            # Configuration files
```

## 📖 Documentation

- **[AGENTS.md](./docs/AGENTS.md)**: Comprehensive agent architecture documentation
- **[API Reference](./docs/api.md)**: Detailed API documentation
- **[Configuration Guide](./docs/configuration.md)**: Configuration options

## 📝 Changelog

- **2025-09-19**
  - Documented polyglot (Node.js + Python ML) stack details and nested frontend structure.
  - Added notes on file-based secrets, RSS-based memory telemetry, idle heartbeats, 60-minute orchestration ceilings, and GPU probe caching.
  - Refreshed configuration examples with `mesh.maxRunDurationMs`, `swarm.maxRunDurationMs`, and GPU probe cache settings.
- **[Deployment Guide](./docs/deployment.md)**: Production deployment

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the foundational Codex technology
- The TypeScript and Node.js communities
- Contributors to swarm intelligence and consensus algorithms
- The distributed systems research community

## 📞 Support

- **Documentation**: Check the [`docs/`](./docs/) directory
- **Examples**: See [`examples/`](./examples/) for usage patterns
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ for the future of AI-powered distributed systems**
