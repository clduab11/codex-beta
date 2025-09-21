<div align="center">

# 🧠 Codex-Synaptic

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/Built_with-TypeScript-007ACC)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js-43853D)](https://nodejs.org/)

**Distributed agent orchestration for Codex-inspired workflows.**

</div>

Codex-Synaptic packages the orchestration primitives used to run a mesh of cooperative agents: a neural-style topology, swarm optimisers, consensus voting, and a persistent memory layer. The system ships as a TypeScript/Node.js CLI that can run interactively or as a background daemon and exposes reusable modules for embedding into other tooling.

---

## Contents

- [Quick Start](#quick-start)
- [CLI Overview](#cli-overview)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [License](#license)

---

## Quick Start

Codex-Synaptic targets Node.js 18+ on macOS, Linux, and Windows. No Python, frontend stacks, or external services are required.

### Install the CLI globally

From a checked-out copy or published tarball:

```bash
npm install -g .
# verify
codex-synaptic --help
```

### Run locally without global install

```bash
npm install
npm run build
npx codex-synaptic system start
```

### First workflow

```bash
# start the orchestrator (idempotent)
codex-synaptic system start

# inspect live telemetry (agents, mesh, swarm, consensus)
codex-synaptic system status

# deploy a few built-in agent workers
codex-synaptic agent deploy --type code_worker --replicas 2
codex-synaptic agent deploy --type validation_worker --replicas 1

# seed a mesh and swarm run
codex-synaptic mesh configure --nodes 6 --topology mesh
codex-synaptic swarm start --algorithm pso --objective quality --objective latency

# submit a high-level task prompt
codex-synaptic task submit "Draft release notes" --priority 5
```

### Detached daemon

```bash
codex-synaptic background start   # launch persistent process
codex-synaptic background status  # show PID and start time
codex-synaptic background stop    # terminate the daemon
```

---

## CLI Overview

The `codex-synaptic` binary wraps the orchestration runtime. Key command families:

- `system`: start, stop, monitor telemetry, and stream metrics.
- `background`: manage the detached daemon (state stored under `~/.codex-synaptic/daemon.json`).
- `agent`: list, deploy, inspect, and remove registered agents.
- `mesh`: configure and inspect the neural mesh topology.
- `swarm`: control swarm optimisation runs and query their status.
- `task`: submit prompts, view history, and follow workflow execution.
- `consensus`: create proposals and cast votes through the consensus manager.
- `bridge`: send messages across the MCP and A2A bridges for external tool integration.
- `hive-mind`: orchestrate multi-stage workflows that combine mesh, swarm, and consensus phases.

Run `codex-synaptic <command> --help` for option details and examples.

---

## Architecture

Codex-Synaptic is composed of loosely coupled TypeScript modules. The CLI simply boots the core system and exposes convenience flows.

### Core modules (located under `src/`)

- `core/system.ts` – The `CodexSynapticSystem` orchestrator. Wires together registry, mesh, swarm, consensus, storage, telemetry, and lifecycle hooks.
- `agents/` – Agent definitions (code, data, validation, consensus, topology, bridge coordinators) and the registry responsible for health + lifecycle tracking.
- `mesh/` – Neural mesh graph algorithms, run-time topology updates, and orchestration ceilings.
- `swarm/` – PSO/ACO/flocking optimisers plus hive-mind utilities.
- `consensus/` – Proposal registry, vote tracking, and decision evaluation helpers.
- `memory/` – SQLite-backed memory system (`sqlite3`) that preserves agent interactions and workflow artefacts under `~/.codex-synaptic/memory.db`.
- `bridging/` + `mcp/` – Bridges for MCP and agent-to-agent (A2A) messaging.
- `cli/` – Commander-based CLI interface, background daemon controls, and interactive helpers.
- `hooks/` – Hook manager for workflow instrumentation.

The runtime keeps a real-time telemetry snapshot (agents by type/status, mesh stats, swarm progress, GPU probe results) that surfaces via CLI commands.

---

## Configuration

Configuration defaults live in `config/`. Common environment variables:

- `CODEX_SYNAPTIC_LOG_LEVEL` – `info` (default), `debug`, or `warn`.
- `CODEX_SYNAPTIC_MAX_AGENTS` – override registry capacity.
- `CODEX_SYNAPTIC_CONFIG_PATH` – point to an alternate configuration file.
- `CODEX_GPU_ACCELERATION` – hint preferred GPU backend (auto-detected otherwise).

Docker images (`docker-compose.yml`, `Dockerfile`) build production and development targets that run the same CLI entrypoints.

---

## Development

```bash
npm install
npm run build        # emit TypeScript to dist/
npm run lint         # eslint code quality checks
npm run test         # vitest unit and integration suites
```

Useful helpers:

- `npm run dev` – start the TypeScript entry point with `ts-node`.
- `npm run cli` – invoke the CLI without global installation.
- `npm run test:watch` – interactive Vitest watch mode.

---

## Testing

Vitest exercises CLI flows, swarm coordination, health monitoring, and agent lifecycle behaviour. Tests expect the SQLite dependency to resolve; ensure `npm install` has completed before running.

---

## License

Codex-Synaptic is released under the [MIT License](LICENSE).
