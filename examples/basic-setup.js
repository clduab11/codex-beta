/**
 * Basic Codex-Synaptic System Setup Example
 * 
 * This example demonstrates how to initialize and use the basic system components.
 */

const { CodexSynapticSystem } = require('../dist/core/system');
const { AgentType, TaskStatus } = require('../dist/core/types');

async function basicSetupExample() {
  console.log('🚀 Starting Codex-Synaptic System...');
  
  // Create system instance
  const system = new CodexSynapticSystem();
  
  try {
    // Initialize all components
    await system.initialize();
    console.log('✅ System initialized successfully');
    
    // Get component references
    const agentRegistry = system.getAgentRegistry();
    const taskScheduler = system.getTaskScheduler();
    const neuralMesh = system.getNeuralMesh();
    const swarmCoordinator = system.getSwarmCoordinator();
    const consensusManager = system.getConsensusManager();
    
    // Display system status
    console.log('\n📊 System Status:');
    console.log('Agents registered:', agentRegistry.getAgentCount());
    console.log('Neural mesh nodes:', neuralMesh.getStatus().nodeCount);
    console.log('Task queue:', taskScheduler.getStatus().queueSize);
    
    // Register a sample agent
    const sampleAgent = {
      id: { id: 'demo-agent-1', type: AgentType.CODE_WORKER, version: '1.0.0' },
      capabilities: [
        { name: 'code-generation', version: '1.0.0', description: 'Generate code', parameters: {} },
        { name: 'code-review', version: '1.0.0', description: 'Review code quality', parameters: {} }
      ],
      resources: { cpu: 4, memory: 2048, storage: 1024, bandwidth: 100 },
      networkInfo: { address: '127.0.0.1', port: 8080, protocol: 'tcp', endpoints: [] },
      status: 'idle',
      created: new Date(),
      lastUpdated: new Date()
    };
    
    agentRegistry.registerAgent(sampleAgent);
    console.log('\n👤 Registered demo agent:', sampleAgent.id.id);
    
    // Submit a sample task
    const task = taskScheduler.submitTask({
      type: 'code_generation',
      requiredCapabilities: ['code-generation'],
      payload: {
        language: 'typescript',
        description: 'Create a REST API endpoint for user management',
        requirements: ['authentication', 'validation', 'error-handling']
      }
    });
    
    console.log('\n📋 Submitted task:', task.id);
    
    // Wait a moment to see task processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Show updated status
    console.log('\n📈 Updated Status:');
    const status = system.getStatus();
    console.log('System components:', Object.keys(status.components));
    console.log('Agent registry:', status.components.agentRegistry);
    console.log('Task scheduler:', status.components.taskScheduler);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Always shutdown gracefully
    console.log('\n⏹️  Shutting down system...');
    await system.shutdown();
    console.log('✅ Shutdown complete');
  }
}

// Handle script execution
if (require.main === module) {
  basicSetupExample()
    .then(() => {
      console.log('\n🎉 Basic setup example completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Example failed:', error);
      process.exit(1);
    });
}

module.exports = { basicSetupExample };