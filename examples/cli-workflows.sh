#!/bin/bash

# Codex-Beta CLI Workflow Examples
# This script demonstrates common CLI usage patterns

echo "🚀 Codex-Beta CLI Workflow Examples"
echo "=================================="

# 1. System Management
echo "📊 Checking system status..."
codex-beta system status

echo ""
echo "🔧 Starting the system (commented out to avoid hanging)..."
# codex-beta system start &
# SYSTEM_PID=$!

# 2. Agent Management
echo "👥 Deploying agents..."
codex-beta agent deploy --type code_worker --replicas 3
codex-beta agent deploy --type data_worker --replicas 2
codex-beta agent deploy --type validation_worker --replicas 1

echo ""
echo "📋 Listing deployed agents..."
codex-beta agent list

# 3. Neural Mesh Creation
echo ""
echo "🕸️  Creating neural mesh..."
codex-beta mesh create --nodes 10 --topology mesh
codex-beta mesh status

# 4. Swarm Coordination
echo ""
echo "🐝 Starting swarm coordination..."
codex-beta swarm start --algorithm pso --agents worker:5,coordinator:2

# 5. Bridge Configuration
echo ""
echo "🌉 Configuring MCP bridge..."
codex-beta bridge mcp --source codex-api --target local-model --protocol grpc

echo ""
echo "🔗 Configuring A2A bridge..."
codex-beta bridge a2a

# 6. Task Management
echo ""
echo "📋 Submitting tasks..."
codex-beta task submit code_generation --priority 5 --data '{"language":"typescript","description":"Create REST API"}'
codex-beta task submit data_analysis --priority 3 --data '{"dataset":"sales_data.csv","analysis_type":"trend"}'

echo ""
echo "📊 Listing tasks..."
codex-beta task list
codex-beta task list --status pending

# 7. Hive-Mind Coordination
echo ""
echo "🧠 Spawning coordinated hive-mind agents..."
codex-beta hive-mind spawn "Create a React dashboard with real-time data visualization" --agents 6 --algorithm pso --auto-scale
codex-beta hive-mind spawn "Analyze customer feedback and generate sentiment reports" --agents 4 --algorithm aco --fault-tolerance
codex-beta hive-mind spawn "Enhanced task with agent directives" --agents-file ./AGENTS.md --agents 5 --algorithm pso
codex-beta hive-mind status

# 8. Consensus Proposals
echo ""
echo "🗳️  Creating consensus proposal..."
codex-beta consensus propose system_upgrade '{"version":"2.0.0","features":["quantum_ready"]}'

echo ""
echo "🗳️  Voting on proposal (example)..."
# codex-beta consensus vote proposal-123 yes

# 9. Interactive Mode Example
echo ""
echo "🎛️  Starting interactive mode (commented out)..."
# codex-beta interactive

echo ""
echo "✨ Workflow examples complete!"
echo ""
echo "📚 For more examples, see:"
echo "  - examples/README.md"
echo "  - docs/AGENTS.md"
echo "  - codex-beta --help"

# Cleanup
echo ""
echo "🧹 Cleaning up..."
codex-beta swarm stop
codex-beta hive-mind terminate
# kill $SYSTEM_PID 2>/dev/null || true

echo "✅ Done!"