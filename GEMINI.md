# Codex-Synaptic Agent Playbook

This document explains how agents inside Codex-Synaptic interact, how to reason about the orchestration runtime, and how to extend the system safely. Use it alongside the CLI help output and the module-level documentation in `src/`.

## 1. Runtime Overview

The `CodexSynapticSystem` (see `src/core/system.ts`) coordinates several subsystems:

- **Agent Registry (`src/agents/registry.ts`)** – Tracks lifecycle, status, capabilities, and resource usage for every agent instance.
- **Task Scheduler (`src/core/scheduler.ts`)** – Assigns queued work to available agents based on capabilities and priority.
- **Neural Mesh (`src/mesh`)** – Maintains graph-based connectivity, enforces topology constraints, and exposes metrics for telemetry.
- **Swarm Coordinator (`src/swarm`)** – Runs PSO/ACO/flocking optimisers for collaborative problem solving and hive-mind scenarios.
- **Consensus Manager (`src/consensus`)** – Manages proposals, votes, and quorum checks for distributed decisions.
- **Bridges (`src/bridging`, `src/mcp`)** – Provide controlled ingress/egress for MCP and A2A messaging.
- **Memory System (`src/memory/memory-system.ts`)** – SQLite-backed persistent storage for agent interactions and artefacts under `~/.codex-synaptic/memory.db`.
- **Telemetry & Health (`src/core/health.ts`, `src/core/resources.ts`)** – Surfaced via CLI commands and used to gate scaling/auto-healing decisions.

## 2. Built-in Agent Roles

| Agent Type | Purpose | Key Implementation |
|------------|---------|--------------------|
| `code_worker` | Code generation, refactoring, and implementation tasks | `src/agents/code_worker.ts` |
| `data_worker` | Data preparation, analysis, and transformation | `src/agents/data_worker.ts` |
| `validation_worker` | Verification, linting, and quality gates | `src/agents/validation_worker.ts` |
| `swarm_coordinator` | Supervises swarm objectives and metrics | `src/agents/swarm_coordinator.ts` |
| `consensus_coordinator` | Runs vote aggregation and conflict resolution | `src/agents/consensus_coordinator.ts` |
| `topology_coordinator` | Adjusts mesh connectivity and constraints | `src/agents/topology_coordinator.ts` |
| `mcp_bridge` / `a2a_bridge` | Translate external requests into internal tasks | `src/agents/mcp_bridge_agent.ts`, `src/agents/a2a_bridge_agent.ts` |

## 3. Execution Flow

1. **System start** – `codex-synaptic system start` boots the orchestrator, loads configuration, and initialises telemetry, GPU probes, and memory storage.
2. **Agent bootstrap** – Default agents are registered; additional replicas can be deployed via `codex-synaptic agent deploy`.
3. **Mesh configuration** – Mesh defaults can be tuned (`codex-synaptic mesh configure --nodes 8 --topology mesh`) before dispatching complex tasks.
4. **Swarm activation** – `codex-synaptic swarm start --algorithm pso` enables collaborative optimisation loops used by hive-mind workflows.
5. **Task dispatch** – Tasks submitted through the CLI or API enter the scheduler queue, receive capability-matched agents, and stream status events.
6. **Consensus checks** – Critical decisions (e.g., promotion of artefacts) can be gated behind proposals/votes via `codex-synaptic consensus ...` commands.
7. **Telemetry + persistence** – Health snapshots, resource metrics, and memory entries are persisted so the background daemon and CLI can resume seamlessly.

## 4. Agent Development Guidelines

- **Keep responsibilities focused.** New agent types should expose clear capabilities and register them through the agent registry utilities.
- **Instrument long running tasks.** Emit progress and heartbeat events so the scheduler keeps accurate status and the telemetry surface stays fresh.
- **Respect resource limits.** Read limits from `ResourceManager` and avoid allocating beyond configured CPU/memory bounds.
- **Integrate with memory.** Use `CodexMemorySystem` to store durable artefacts or contextual knowledge shared across runs.
- **Participate in consensus when required.** Agents that introduce risky changes should submit proposals or votes with enough context for auditability.

## 5. CLI Workflow Tips

- Run `codex-synaptic system monitor` in a dedicated terminal when developing new agent logic.
- Use the `background` commands to keep long-running coordination alive between sessions.
- Combine `mesh` and `swarm` commands to stress-test new strategies before exposing them to production tasks.
- Query `codex-synaptic task recent` to audit how prompts flow through the system and to inspect generated artefacts.

## 6. Extending the Platform

1. Scaffold a new agent under `src/agents/` and register it with the agent registry.
2. Add capabilities and resource requirements so the scheduler can route work correctly.
3. Update CLI help (if you expose new coordination primitives) in `src/cli/index.ts`.
4. Document the new workflow in `docs/` or the README so operators understand how to invoke it.
5. Add corresponding Vitest coverage under `tests/` to lock in behaviour.

Following these conventions keeps the Codex-Synaptic ecosystem consistent and makes it easier for the CLI, telemetry, and automation hooks to reason about every agent in the mesh.
