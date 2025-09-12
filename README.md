# Codex-Beta

Enhanced OpenAI Codex with MCP/A2A bridging, neural meshes, swarm coordination, topological constraints, and various consensus mechanisms.

## 🚀 Overview

Codex-Beta is a comprehensive system for enhancing OpenAI's Codex with advanced distributed agent capabilities. It provides a scalable architecture for multi-agent coordination, neural mesh networking, swarm optimization, and distributed consensus mechanisms.

### Key Features

- **🤖 Multi-Agent System**: Deploy different types of agents (CodeWorker, DataWorker, ValidationWorker, etc.)
- **🕸️ Neural Mesh**: Self-organizing interconnected agent networks
- **🐝 Swarm Coordination**: PSO, ACO, and flocking algorithms for collective intelligence
- **🗳️ Consensus Mechanisms**: Byzantine fault tolerance, RAFT, Proof of Work/Stake
- **🌉 Bridging**: MCP (Model Control Protocol) and A2A (Agent-to-Agent) integration
- **⚙️ CLI Interface**: Comprehensive command-line tools for deployment and management
- **📊 Monitoring**: Built-in logging, metrics, and system health monitoring
- **🔧 Configuration**: Flexible YAML/JSON configuration management

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [CLI Usage](#cli-usage)
- [API Documentation](#api-documentation)
- [Examples](#examples)
- [Configuration](#configuration)
- [Testing](#testing)
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
npm install
npm run build
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

### 2. Deploy Agents

```bash
# Deploy code generation workers
codex-beta agent deploy --type code_worker --replicas 3

# Deploy data processing workers  
codex-beta agent deploy --type data_worker --replicas 2

# Deploy validation workers
codex-beta agent deploy --type validation_worker --replicas 1
```

### 3. Create Neural Mesh

```bash
# Create interconnected mesh network
codex-beta mesh create --nodes 10 --topology mesh

# Check mesh status
codex-beta mesh status
```

### 4. Start Swarm Coordination

```bash
# Start PSO (Particle Swarm Optimization) 
codex-beta swarm start --algorithm pso --agents worker:5,coordinator:2

# Start ACO (Ant Colony Optimization)
codex-beta swarm start --algorithm aco --agents worker:8,coordinator:1
```

### 5. Submit Tasks

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
    "heartbeatInterval": 30000
  },
  "mesh": {
    "maxConnections": 10,
    "topology": "mesh"
  },
  "swarm": {
    "defaultAlgorithm": "pso",
    "maxIterations": 1000
  },
  "consensus": {
    "mechanism": "raft",
    "timeout": 10000
  }
}
```

### Environment Variables

```bash
CODEX_BETA_LOG_LEVEL=debug
CODEX_BETA_MAX_AGENTS=50
CODEX_BETA_CONFIG_PATH=./custom-config.json
```

## 🧪 Testing

### Run Test Suite

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure

- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing  
- **End-to-End Tests**: Full system workflow testing

Current test coverage: **11 tests passing**

```
Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
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
├── tests/             # Test suites
├── examples/          # Usage examples
├── docs/              # Documentation
└── config/            # Configuration files
```

## 📖 Documentation

- **[AGENTS.md](./docs/AGENTS.md)**: Comprehensive agent architecture documentation
- **[API Reference](./docs/api.md)**: Detailed API documentation
- **[Configuration Guide](./docs/configuration.md)**: Configuration options
- **[Deployment Guide](./docs/deployment.md)**: Production deployment

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`  
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

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
