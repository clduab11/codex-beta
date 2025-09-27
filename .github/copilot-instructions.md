# GitHub Copilot Instructions for Codex-Synaptic

## Repository Overview
Codex-Synaptic is an advanced distributed AI agent orchestration platform featuring neural mesh networking, swarm intelligence, and consensus mechanisms. The system enhances OpenAI's Codex with multi-agent capabilities, MCP/A2A bridging, and sophisticated coordination patterns.

## Architecture & Code Organization

### Core Modules Structure
- `src/core/` - System core (scheduler, health monitoring, configuration)
- `src/agents/` - Agent implementations (workers, coordinators, bridges)
- `src/cli/` - Command-line interface and context building
- `src/mesh/` - Neural mesh networking components
- `src/swarm/` - Swarm coordination algorithms (PSO, ACO, flocking)
- `src/consensus/` - Consensus mechanisms (BFT, RAFT, PoW, PoS)
- `src/memory/` - Persistent storage and memory systems
- `src/types/` - TypeScript type definitions

### Key Design Patterns
1. **Agent Pattern**: All agents extend base agent classes with standardized lifecycle
2. **Registry Pattern**: Central agent registration with capability discovery
3. **Observer Pattern**: Event-driven communication between components
4. **Strategy Pattern**: Pluggable algorithms for consensus and swarm coordination
5. **Builder Pattern**: Context building and configuration assembly

## Coding Standards & Best Practices

### TypeScript Guidelines
- Use strict TypeScript with proper type annotations
- Prefer interfaces over types for extensibility
- Use enums for constants with semantic meaning
- Always handle async operations with proper error catching
- Use meaningful generic type parameters (`<T extends Agent>` not `<T>`)

### Agent Development
- Agents must implement the base `Agent` interface
- Register capabilities through the agent registry utilities
- Emit progress and heartbeat events for long-running tasks
- Respect resource limits from `ResourceManager`
- Use `CodexMemorySystem` for persistent storage
- Participate in consensus for risky changes

### Error Handling
- Use structured logging with appropriate levels (info, warn, error)
- Throw specific error types, not generic Error objects
- Always cleanup resources in finally blocks
- Use exponential backoff for retries
- Log context data with error messages

### Testing Requirements
- Write unit tests for all new agent types and core functionality
- Use Vitest testing framework (already configured)
- Mock external dependencies and system resources
- Test error conditions and edge cases
- Maintain test coverage for critical paths

### Performance Considerations
- Respect MAX_AGENT_BYTES (48,000) and MAX_CONTEXT_BYTES limits
- Use streaming for large data operations
- Implement proper resource cleanup and memory management
- Monitor agent lifecycle and prevent memory leaks
- Use connection pooling for database operations

## Security Guidelines
- Never commit secrets or API keys to source code
- Use certificate-based authentication for agent identity
- Implement proper input validation and sanitization
- Apply role-based access control (RBAC) patterns
- Use end-to-end encryption for agent communications
- Validate all external inputs and API responses

## CLI Development
- Follow Commander.js patterns for command structure
- Use CodexContextBuilder for context aggregation
- Implement proper help text and examples
- Support both synchronous and background operations
- Provide meaningful progress feedback

## Database & Memory
- Use SQLite for local persistence (memory.db)
- Implement proper transaction handling
- Use prepared statements for queries
- Handle database migration scenarios
- Cleanup temporary data and expired sessions

## Neural Mesh & Networking
- Implement proper topology constraints
- Handle node connectivity failures gracefully
- Use deterministic routing algorithms
- Monitor mesh health and performance metrics
- Support dynamic topology reconfiguration

## Swarm Coordination
- Implement swarm algorithms with configurable parameters
- Support multiple optimization objectives
- Handle agent failures during swarm operations
- Provide convergence metrics and stopping criteria
- Enable real-time parameter tuning

## Consensus Mechanisms
- Implement Byzantine fault tolerance where required
- Use appropriate consensus algorithm for the use case
- Handle network partitions and split-brain scenarios
- Provide audit trails for all consensus decisions
- Support different voting and quorum mechanisms

## Integration Patterns

### MCP (Model Control Protocol) Bridge
- Implement protocol translation between different AI models
- Handle API versioning and compatibility issues
- Provide fallback mechanisms for unavailable models
- Cache responses appropriately

### A2A (Agent-to-Agent) Bridge
- Use secure messaging protocols
- Implement capability discovery mechanisms
- Handle agent authentication and authorization
- Support both synchronous and asynchronous communication

## Code Examples & Patterns

### Agent Registration Example
```typescript
const agent = new CodeWorkerAgent(agentId, {
  capabilities: ['code_generation', 'refactoring'],
  resourceLimits: { maxMemoryMB: 512, maxCpuPercent: 25 }
});

await system.getAgentRegistry().registerAgent(agent);
```

### Context Building Example
```typescript
const builder = new CodexContextBuilder(rootDir);
const result = await builder
  .withAgentDirectives()
  .withReadmeExcerpts()
  .withDirectoryInventory()
  .withDatabaseMetadata()
  .build();
```

### Consensus Proposal Example
```typescript
const proposal = await consensusManager.propose('system_upgrade', {
  description: 'Deploy new ML model version 2.1',
  votesRequired: 5,
  timeout: 300000
});
```

## Development Workflow

### Local Development
1. Install dependencies: `npm install`
2. Build project: `npm run build`
3. Run tests: `npm test`
4. Start CLI: `npm run cli`
5. Lint code: `npm run lint`

### Testing Strategy
- Unit tests for individual components
- Integration tests for agent coordination
- End-to-end tests for CLI workflows
- Performance tests for swarm algorithms
- Security tests for consensus mechanisms

### Deployment Considerations
- Use Docker for containerized deployments
- Configure resource limits appropriately
- Set up proper logging and monitoring
- Implement health checks and readiness probes
- Use configuration files for environment-specific settings

## Common Pitfalls to Avoid
- Don't block the event loop with synchronous operations
- Don't ignore resource limits or memory constraints
- Don't skip error handling in async operations
- Don't hardcode configuration values
- Don't forget to cleanup resources and event listeners
- Don't bypass the agent registry for agent communication
- Don't implement custom consensus without proper testing

## When Suggesting Code Changes
1. Always consider the impact on the neural mesh topology
2. Ensure new agents register proper capabilities
3. Follow the existing logging and error handling patterns
4. Consider resource limits and performance implications
5. Add appropriate tests for new functionality
6. Update documentation if adding new CLI commands
7. Consider backwards compatibility for agent interfaces

This repository implements sophisticated distributed systems patterns. Always consider the multi-agent, distributed nature of the system when making suggestions.