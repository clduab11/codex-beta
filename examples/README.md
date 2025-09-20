# Codex-Synaptic Examples

This directory contains practical examples of using the Codex-Synaptic system for various scenarios.

## Basic Setup Example

```typescript
import { CodexSynapticSystem } from 'codex-synaptic';

async function basicExample() {
  // Create and initialize the system
  const system = new CodexSynapticSystem();
  await system.initialize();

  // Get references to key components
  const agentRegistry = system.getAgentRegistry();
  const taskScheduler = system.getTaskScheduler();
  const swarmCoordinator = system.getSwarmCoordinator();

  console.log('System ready with', agentRegistry.getAgentCount(), 'agents');
  
  // Shutdown gracefully
  await system.shutdown();
}

basicExample().catch(console.error);
```

## Code Generation Swarm

```javascript
// Example: Deploy a swarm of code generation agents
const codeGenerationSwarm = {
  agents: [
    { type: 'code_worker', count: 5, capabilities: ['javascript', 'python', 'typescript'] },
    { type: 'validation_worker', count: 2, capabilities: ['testing', 'linting', 'security'] },
    { type: 'swarm_coordinator', count: 1, capabilities: ['orchestration'] }
  ],
  algorithm: 'pso',
  objectives: ['code_quality', 'performance', 'maintainability']
};
```

## Distributed Consensus Example

```typescript
// Example: Use consensus for distributed decision making
async function consensusExample(system: CodexSynapticSystem) {
  const consensusManager = system.getConsensusManager();
  
  // Propose a system upgrade
  const proposalId = consensusManager.proposeConsensus(
    'system_upgrade',
    { version: '2.0.0', features: ['enhanced_mesh', 'quantum_ready'] },
    { id: 'coordinator-1', type: 'swarm_coordinator', version: '1.0.0' }
  );
  
  // Agents can vote on the proposal
  consensusManager.on('consensusReached', (result) => {
    if (result.accepted) {
      console.log('Upgrade approved!');
      // Proceed with upgrade
    } else {
      console.log('Upgrade rejected');
    }
  });
}
```

## Neural Mesh Coordination

```typescript
// Example: Create a self-organizing neural mesh
async function neuralMeshExample(system: CodexSynapticSystem) {
  const mesh = system.getNeuralMesh();
  
  mesh.on('topologyChanged', (topology) => {
    console.log(`Mesh updated: ${topology.nodes.length} nodes, ${topology.connections} connections`);
  });
  
  // The mesh automatically adjusts as agents join/leave
  console.log('Mesh status:', mesh.getStatus());
}
```

## See Individual Example Files

- [`basic-setup.js`](./basic-setup.js) - Simple system initialization
- [`swarm-optimization.js`](./swarm-optimization.js) - PSO and ACO examples  
- [`consensus-voting.js`](./consensus-voting.js) - Distributed decision making
- [`neural-mesh.js`](./neural-mesh.js) - Self-organizing networks
- [`mcp-bridging.js`](./mcp-bridging.js) - External model integration
- [`cli-workflows.sh`](./cli-workflows.sh) - Command line examples