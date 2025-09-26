#!/bin/bash

# Codex-Synaptic CLI Workflow Examples
# This script demonstrates common CLI usage patterns

echo "🚀 Codex-Synaptic CLI Workflow Examples"
echo "=================================="

# 1. System Management
echo "📊 Checking system status..."
codex-synaptic system status

echo ""
echo "🔧 Starting the system (commented out to avoid hanging)..."
# codex-synaptic system start &
# SYSTEM_PID=$!

# 2. Agent Management
echo "👥 Deploying agents..."
codex-synaptic agent deploy --type code_worker --replicas 3
codex-synaptic agent deploy --type data_worker --replicas 2
codex-synaptic agent deploy --type validation_worker --replicas 1

echo ""
echo "📋 Listing deployed agents..."
codex-synaptic agent list

# 3. Neural Mesh Creation
echo ""
echo "🕸️  Creating neural mesh..."
codex-synaptic mesh create --nodes 10 --topology mesh
codex-synaptic mesh status

# 4. Swarm Coordination
echo ""
echo "🐝 Starting swarm coordination..."
codex-synaptic swarm start --algorithm pso --agents worker:5,coordinator:2

# 5. Bridge Configuration
echo ""
echo "🌉 Configuring MCP bridge..."
codex-synaptic bridge mcp --source codex-api --target local-model --protocol grpc

echo ""
echo "🔗 Configuring A2A bridge..."
codex-synaptic bridge a2a

# 6. Task Management
echo ""
echo "📋 Submitting tasks..."
codex-synaptic task submit code_generation --priority 5 --data '{"language":"typescript","description":"Create REST API"}'
codex-synaptic task submit data_analysis --priority 3 --data '{"dataset":"sales_data.csv","analysis_type":"trend"}'

echo ""
echo "📊 Listing tasks..."
codex-synaptic task list
codex-synaptic task list --status pending

# 7. Hive-Mind Coordination
echo ""
echo "🧠 Spawning coordinated hive-mind agents..."
codex-synaptic hive-mind spawn "Create a React dashboard with real-time data visualization" --agents 6 --algorithm pso --auto-scale
codex-synaptic hive-mind spawn "Analyze customer feedback and generate sentiment reports" --agents 4 --algorithm aco --fault-tolerance
codex-synaptic hive-mind status

# 8. Consensus Proposals
echo ""
echo "🗳️  Creating consensus proposal..."
codex-synaptic consensus propose system_upgrade '{"version":"2.0.0","features":["quantum_ready"]}'

echo ""
echo "🗳️  Voting on proposal (example)..."
# codex-synaptic consensus vote proposal-123 yes

# 9. Interactive Mode Example
echo ""
echo "🎛️  Starting interactive mode (commented out)..."
# codex-synaptic interactive

echo ""
echo "✨ Workflow examples complete!"
echo ""
echo "📚 For more examples, see:"
echo "  - examples/README.md"
echo "  - AGENTS.md"
echo "  - codex-synaptic --help"

# Cleanup
echo ""
echo "🧹 Cleaning up..."
codex-synaptic swarm stop
codex-synaptic hive-mind terminate
# kill $SYSTEM_PID 2>/dev/null || true

echo "✅ Done!"