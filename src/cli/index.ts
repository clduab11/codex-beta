#!/usr/bin/env node

/**
 * Codex-Synaptic CLI - System orchestration, workflow execution, and telemetry surface
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { CliSession } from './session.js';
import { CodexSynapticSystem } from '../core/system.js';
import { AgentType, AgentMetadata } from '../core/types.js';
import {
  getBackgroundStatus,
  startBackgroundSystem,
  stopBackgroundSystem
} from './daemon-manager.js';
import {
  CodexContextBuilder,
  composePromptWithContext,
  renderCodexContextBlock,
  type CodexContextBuildResult
} from './codex-context.js';
import type {
  CodexContext,
  CodexContextAggregationMetadata,
  CodexPromptEnvelope,
  ContextLogEntry
} from '../types/codex-context.js';
import { RetryManager } from '../core/errors.js';
import { HiveMindYamlFormatter, YamlFeedforwardFilter, EndpointCapabilities } from '../utils/yaml-output.js';
import { InstructionParser } from '../instructions/index.js';
import { RoutingPolicyService } from '../router/index.js';

const program = new Command();
const session = CliSession.getInstance();

program
  .name('codex-synaptic')
  .description('Enhanced OpenAI Codex with distributed agent capabilities')
  .version('1.0.0');

function handleCommand<T extends any[]>(name: string, fn: (...args: T) => Promise<void>) {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      const err = error as Error;
      console.error(chalk.red(`❌ ${name} failed: ${err.message}`));
      if (process.env.CODEX_DEBUG === '1' && err.stack) {
        console.error(chalk.gray(err.stack));
      }
      process.exitCode = 1;
    }
  };
}

async function useSystem(description: string, fn: (system: CodexSynapticSystem) => Promise<void>): Promise<void> {
  const alreadyRunning = !!session.getSystemUnsafe();
  if (!alreadyRunning) {
    console.log(chalk.blue(`🔧 Initializing Codex-Synaptic system (${description})...`));
  }
  const system = await session.ensureSystem();
  await fn(system);
}

function parseInteger(value: string, label: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${label} must be a number`);
  }
  return parsed;
}

function parseJsonInput(value: string, label: string): any {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}

function renderAgentTable(agents: AgentMetadata[]): void {
  if (!agents.length) {
    console.log(chalk.gray('No agents registered.'));
    return;
  }

  const rows = agents.map((agent) => ({
    id: agent.id.id,
    type: agent.id.type,
    status: agent.status,
    capabilities: agent.capabilities.map((cap) => cap.name).join(', '),
    lastUpdated: agent.lastUpdated.toISOString()
  }));

  console.table(rows);
}

function renderMeshStatus(status: any): void {
  console.log(chalk.blue('🕸️  Neural Mesh'));
  console.log(`  Running: ${status.isRunning ? chalk.green('yes') : chalk.red('no')}`);
  console.log(`  Nodes: ${status.nodeCount}`);
  console.log(`  Connections: ${status.connectionCount}`);
  console.log(`  Avg connections: ${status.averageConnections.toFixed(2)}`);
  console.log(`  Topology: ${status.topology}`);
  if (typeof status.maxRunDurationMs !== 'undefined') {
    const limitLabel = status.maxRunDurationMs > 0 ? `${Math.round(status.maxRunDurationMs / 60000)}m` : 'disabled';
    const remainingMinutes = status.runActive && typeof status.remainingTimeMs === 'number'
      ? Math.max(0, Math.ceil(status.remainingTimeMs / 60000))
      : null;
    const activityLabel = status.runActive ? chalk.green('active') : chalk.gray('inactive');
    const remainingLabel = remainingMinutes !== null ? `, ${remainingMinutes}m remaining` : '';
    console.log(`  Orchestration: ${activityLabel} (limit ${limitLabel}${remainingLabel})`);
  }
}

function renderSwarmStatus(status: any): void {
  console.log(chalk.blue('🐝 Swarm Coordination'));
  console.log(`  Running: ${status.isRunning ? chalk.green('yes') : chalk.red('no')}`);
  console.log(`  Algorithm: ${status.algorithm}`);
  console.log(`  Particle count: ${status.particleCount}`);
  console.log(`  Optimizing: ${status.isOptimizing ? 'yes' : 'no'}`);
  if (typeof status.maxRunDurationMs !== 'undefined') {
    const limitLabel = status.maxRunDurationMs > 0 ? `${Math.round(status.maxRunDurationMs / 60000)}m` : 'disabled';
    const remainingMinutes = status.isOptimizing && typeof status.remainingTimeMs === 'number'
      ? Math.max(0, Math.ceil(status.remainingTimeMs / 60000))
      : null;
    const activityLabel = status.isOptimizing ? chalk.green('active') : chalk.gray('idle');
    const remainingLabel = remainingMinutes !== null ? `, ${remainingMinutes}m remaining` : '';
    console.log(`  Orchestration: ${activityLabel} (limit ${limitLabel}${remainingLabel})`);
  }
}

function renderConsensusStatus(system: CodexSynapticSystem): void {
  const manager = system.getConsensusManager();
  const status = manager.getStatus();
  console.log(chalk.blue('🗳️  Consensus Manager'));
  console.log(`  Running: ${status.isRunning ? chalk.green('yes') : chalk.red('no')}`);
  console.log(`  Active proposals: ${status.activeProposals}`);
  console.log(`  Votes tracked: ${status.totalVotes}`);

  const proposals = manager.getActiveProposals();
  if (proposals.length) {
    console.log(chalk.cyan('  Proposals:'));
    for (const proposal of proposals) {
      const votes = manager.getVotes(proposal.id);
      const yesVotes = votes.filter((vote) => vote.vote).length;
      const noVotes = votes.length - yesVotes;
      console.log(`    • ${proposal.id} [${proposal.type}] — ${yesVotes} yes / ${noVotes} no / ${proposal.requiredVotes} required`);
    }
  }
}

function renderTelemetry(): void {
  const snapshot = session.getTelemetry();
  console.log(chalk.blue('📊 Telemetry Snapshot'));
  console.log(`  Agents: ${snapshot.agents.total} total (${snapshot.agents.available} available)`);
  console.log(`  By Type: ${Object.entries(snapshot.agents.byType).map(([key, value]) => `${key}:${value}`).join(' | ') || 'none'}`);
  console.log(`  By Status: ${Object.entries(snapshot.agents.byStatus).map(([key, value]) => `${key}:${value}`).join(' | ') || 'none'}`);
  if (snapshot.resources) {
    const usage = snapshot.resources;
    let memory: string;
    if (usage.memoryStatus) {
      const stateLabel = usage.memoryStatus.state === 'critical'
        ? chalk.red('critical')
        : usage.memoryStatus.state === 'elevated'
          ? chalk.yellow('elevated')
          : chalk.green('normal');
      const limit = usage.memoryStatus.limitMB;
      memory = `${usage.memoryStatus.usageMB.toFixed(1)}MB / ${limit}MB (${stateLabel})`;
      const headroom = usage.memoryStatus.headroomMB;
      if (Number.isFinite(headroom)) {
        memory += `, headroom ${headroom.toFixed(1)}MB`;
      }
    } else {
      memory = Number.isFinite(usage.memoryMB) ? `${usage.memoryMB.toFixed(1)}MB` : 'n/a';
    }
    const cpu = Number.isFinite(usage.cpuPercent) ? usage.cpuPercent.toFixed(2) : 'n/a';
    console.log(`  Memory: ${memory} | CPU: ${cpu}% | Tasks: ${usage.concurrentTasks}`);
    if (usage.gpu) {
      const gpu = usage.gpu;
      const label = gpu.selectedBackend === 'cpu' ? 'CPU only' : `${gpu.selectedBackend.toUpperCase()} (${gpu.devices.map((d) => d.name).join(', ') || 'detected'})`;
      console.log(`  GPU: ${label}`);
    }
  }
  if (snapshot.mesh) {
    console.log(`  Mesh: ${snapshot.mesh.nodeCount} nodes / ${snapshot.mesh.connectionCount} connections`);
  }
  if (snapshot.swarm) {
    console.log(`  Swarm: algo=${snapshot.swarm.algorithm} optimizing=${snapshot.swarm.isOptimizing}`);
  }
  if (snapshot.consensus) {
    console.log(`  Last consensus: ${(snapshot.consensus.proposal?.id ?? 'n/a')} accepted=${snapshot.consensus.accepted}`);
  }
  if (snapshot.recentTasks.length) {
    console.log('  Recent tasks:');
    for (const task of snapshot.recentTasks.slice(0, 5)) {
      console.log(`    • ${task.id} (${task.status}) — ${task.summary}`);
    }
  }
}

function emitContextLogs(logs: ContextLogEntry[]): void {
  if (!logs.length) {
    return;
  }
  console.log(chalk.blue('🧾 Codex context aggregation log'));
  for (const entry of logs) {
    const detailText = entry.details ? formatDetailEntry(entry.details) : '';
    const suffix = detailText ? chalk.gray(` (${detailText})`) : '';
    if (entry.level === 'info') {
      console.log(chalk.gray(`  • ${entry.message}`) + suffix);
    } else if (entry.level === 'warn') {
      console.log(chalk.yellow(`  ⚠️ ${entry.message}`) + suffix);
    } else {
      console.log(chalk.red(`  ❗ ${entry.message}`) + suffix);
    }
  }
}

function emitContextSummary(context: CodexContext, metadata: CodexContextAggregationMetadata): void {
  console.log(chalk.blue('🧠 Codex context summary'));
  console.log(chalk.gray(`  • Context hash: ${context.contextHash}`));
  console.log(chalk.gray(`  • Context size: ${context.sizeBytes} bytes`));
  console.log(chalk.gray(`  • Agent directives: ${metadata.agentGuideCount} file(s)`));
  console.log(chalk.gray(`  • README excerpts: ${context.readmeExcerpts.length}`));
  console.log(chalk.gray(`  • .codex directories: ${metadata.codexDirectoryCount}`));
  console.log(chalk.gray(`  • Database artifacts: ${metadata.databaseCount}`));
  if (context.warnings.length) {
    for (const warning of context.warnings) {
      console.log(chalk.yellow(`  ⚠️ ${warning}`));
    }
  }
}

async function primeCodexWithRetry(
  system: CodexSynapticSystem,
  context: CodexContext,
  envelope: CodexPromptEnvelope
): Promise<void> {
  await RetryManager.executeWithRetry(async () => {
    await system.primeCodexInterface(context, envelope);
  }, 3, 500, 4000);
  console.log(chalk.green(`🔐 Codex CLI primed (hash ${context.contextHash.slice(0, 8)}…).`));
}

function formatDetailEntry(details: Record<string, unknown>): string {
  return Object.entries(details)
    .map(([key, value]) => `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join(', ');
}

// System commands
const systemCmd = program.command('system').description('System management commands');

systemCmd
  .command('start')
  .description('Start the Codex-Synaptic system (idempotent)')
  .action(handleCommand('system.start', async () => {
    if (session.getSystemUnsafe()) {
      console.log(chalk.yellow('⚠️  Codex-Synaptic system already running.'));
      renderTelemetry();
      return;
    }

    await useSystem('system start', async (system) => {
      console.log(chalk.green('✅ Codex-Synaptic system initialized.'));
      renderTelemetry();
      renderMeshStatus(system.getNeuralMesh().getStatus());
      renderSwarmStatus(system.getSwarmCoordinator().getStatus());
      renderConsensusStatus(system);
    });
  }));

systemCmd
  .command('status')
  .description('Show system status and telemetry')
  .action(handleCommand('system.status', async () => {
    const system = session.getSystemUnsafe();
    if (!system) {
      console.log(chalk.yellow('⚠️  System not started. Run `codex-synaptic system start` first.'));
      return;
    }

    const status = system.getStatus();
    console.log(chalk.blue('🧠 Codex-Synaptic System Status'));
    console.log(`  Initialized: ${status.initialized}`);
    console.log(`  Shutting down: ${status.shuttingDown}`);
    renderTelemetry();
  }));

systemCmd
  .command('stop')
  .description('Stop the Codex-Synaptic system and release resources')
  .action(handleCommand('system.stop', async () => {
    if (!session.getSystemUnsafe()) {
      console.log(chalk.gray('System already stopped.'));
      return;
    }

    await session.shutdown('manual-stop');
    console.log(chalk.green('✅ Codex-Synaptic system shutdown complete.'));
  }));

systemCmd
  .command('monitor')
  .description('Stream live telemetry until interrupted')
  .option('-i, --interval <ms>', 'Refresh interval in milliseconds', '2000')
  .action(handleCommand('system.monitor', async (options) => {
    await useSystem('system monitor', async () => {
      const intervalMs = parseInteger(options.interval, 'interval');
      console.log(chalk.blue('📡 Streaming telemetry (Ctrl+C to stop)...'));
      const render = () => {
        console.log('\n' + chalk.gray('─'.repeat(40)));
        renderTelemetry();
      };
      render();
      const timer = setInterval(render, intervalMs);
      const stop = () => clearInterval(timer);
      process.once('SIGINT', stop);
      process.once('SIGTERM', stop);
      await new Promise<void>((resolve) => {
        const cleanup = () => {
          process.removeListener('SIGINT', stop);
          process.removeListener('SIGTERM', stop);
          stop();
          resolve();
        };
        process.once('SIGINT', cleanup);
        process.once('SIGTERM', cleanup);
      });
    });
  }));

// Background daemon commands
const backgroundCmd = program.command('background').description('Manage the background Codex-Synaptic daemon');

backgroundCmd
  .command('status')
  .description('Show the status of the detached background system')
  .action(handleCommand('background.status', async () => {
    const status = getBackgroundStatus();
    if (!status.running) {
      console.log(chalk.gray('Background system is not running.'));
      return;
    }
    console.log(chalk.blue('🛰 Background system'));
    console.log(`  PID: ${status.pid}`);
    console.log(`  Started at: ${status.startedAt}`);
  }));

backgroundCmd
  .command('start')
  .description('Launch a detached background system instance')
  .action(handleCommand('background.start', async () => {
    const status = await startBackgroundSystem();
    if (!status.running) {
      console.log(chalk.red('Failed to start background system.'));
      return;
    }
    console.log(chalk.green(`✅ Background system running (pid ${status.pid})`));
    if (status.startedAt) {
      console.log(`  Started at: ${status.startedAt}`);
    }
  }));

backgroundCmd
  .command('stop')
  .description('Terminate the detached background system')
  .option('-t, --timeout <ms>', 'Timeout before force stopping', '10000')
  .action(handleCommand('background.stop', async (options) => {
    const timeout = parseInteger(options.timeout, 'timeout');
    const result = await stopBackgroundSystem(timeout);
    switch (result) {
      case 'stopped':
        console.log(chalk.green('✅ Background system stopped.'));
        break;
      case 'not_running':
        console.log(chalk.gray('Background system was not running.'));
        break;
      case 'timeout':
        console.log(chalk.yellow('⚠️  Background system did not stop before timeout.')); 
        break;
    }
  }));

// Instructions commands
const instructionsCmd = program.command('instructions').description('Instruction processing and cache management');

instructionsCmd
  .command('sync')
  .description('Synchronize and cache AGENTS.md instructions from repository')
  .option('-r, --root <path>', 'Repository root path', process.cwd())
  .option('--no-cache', 'Skip cache and force fresh scan')
  .option('-v, --verbose', 'Show detailed processing information')
  .action(handleCommand('instructions.sync', async (options) => {
    const parser = new InstructionParser();
    try {
      console.log(chalk.cyan('🔄 Synchronizing instruction files...'));
      
      const startTime = Date.now();
      const context = await parser.parseInstructions(options.root, options.cache);
      const duration = Date.now() - startTime;
      
      if (options.verbose) {
        console.log(chalk.gray(`Processed ${context.metadata.length} instruction files`));
        console.log(chalk.gray(`Precedence chain: ${context.precedenceChain.join(' → ')}`));
        console.log(chalk.gray(`Context hash: ${context.contextHash}`));
        console.log(chalk.gray(`Total size: ${context.aggregatedSize} bytes`));
        console.log(chalk.gray(`Processing time: ${duration}ms`));
      }
      
      console.log(chalk.green(`✅ Instructions synchronized successfully`));
      console.log(`📁 Files processed: ${context.metadata.length}`);
      console.log(`🔗 Context hash: ${context.contextHash.slice(0, 12)}...`);
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to sync instructions: ${error}`));
      process.exitCode = 1;
    } finally {
      await parser.close();
    }
  }));

instructionsCmd
  .command('validate')
  .argument('[file]', 'Specific AGENTS.md file to validate (optional)')
  .description('Validate AGENTS.md file syntax and structure')
  .option('-r, --root <path>', 'Repository root path', process.cwd())
  .action(handleCommand('instructions.validate', async (file, options) => {
    const parser = new InstructionParser();
    try {
      if (file) {
        // Validate specific file
        console.log(chalk.cyan(`🔍 Validating ${file}...`));
        const result = await parser.validateInstructionSyntax(file);
        
        if (result.isValid) {
          console.log(chalk.green(`✅ ${file} is valid`));
        } else {
          console.log(chalk.red(`❌ ${file} has validation errors:`));
          result.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
          process.exitCode = 1;
        }
      } else {
        // Validate all files in repository
        console.log(chalk.cyan('🔍 Validating all instruction files...'));
        const context = await parser.parseInstructions(options.root, false);
        
        const invalidFiles = context.metadata.filter(m => !m.isValid);
        if (invalidFiles.length === 0) {
          console.log(chalk.green(`✅ All ${context.metadata.length} instruction files are valid`));
        } else {
          console.log(chalk.red(`❌ Found ${invalidFiles.length} invalid files:`));
          invalidFiles.forEach(file => {
            console.log(chalk.red(`  • ${file.path}:`));
            file.validationErrors?.forEach(error => console.log(chalk.red(`    - ${error}`)));
          });
          process.exitCode = 1;
        }
      }
    } catch (error) {
      console.error(chalk.red(`❌ Validation failed: ${error}`));
      process.exitCode = 1;
    } finally {
      await parser.close();
    }
  }));

instructionsCmd
  .command('cache')
  .description('Manage instruction cache')
  .option('--clear [path]', 'Clear cache for specific path or all if no path given')
  .option('--status', 'Show cache status')
  .action(handleCommand('instructions.cache', async (options) => {
    const parser = new InstructionParser();
    try {
      if (options.clear !== undefined) {
        const pathToClear = options.clear || undefined;
        await parser.clearCache(pathToClear);
        console.log(chalk.green(`✅ Cache cleared${pathToClear ? ` for ${pathToClear}` : ''}`));
      } else if (options.status) {
        console.log(chalk.cyan('📊 Cache status:'));
        // TODO: Implement cache status display
        console.log(chalk.gray('Cache status display coming soon...'));
      } else {
        console.log(chalk.yellow('⚠️  Please specify --clear or --status'));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Cache operation failed: ${error}`));
      process.exitCode = 1;
    } finally {
      await parser.close();
    }
  }));

// Router commands
const routerCmd = program.command('router').description('Routing policy management and evaluation');

routerCmd
  .command('evaluate')
  .argument('<prompt>', 'Prompt to evaluate for routing')
  .description('Evaluate routing for a given prompt')
  .option('-c, --context <file>', 'Context file to include')
  .option('-e, --exclude <agents>', 'Comma-separated list of agents to exclude')
  .option('-p, --prefer <agents>', 'Comma-separated list of preferred agents')
  .option('-v, --verbose', 'Show detailed evaluation information')
  .action(handleCommand('router.evaluate', async (prompt, options) => {
    const router = new RoutingPolicyService();
    try {
      console.log(chalk.cyan('🔄 Evaluating routing for prompt...'));
      
      const request = {
        prompt,
        context: options.context ? {
          fileContext: require('fs').readFileSync(options.context, 'utf8')
        } : undefined,
        constraints: {
          excludeAgents: options.exclude ? options.exclude.split(',').map((s: string) => s.trim()) : undefined,
          preferredAgents: options.prefer ? options.prefer.split(',').map((s: string) => s.trim()) : undefined
        }
      };
      
      const evaluation = await router.evaluateRouting(request);
      
      console.log(chalk.green(`✅ Routing evaluation completed`));
      console.log(`🎯 Recommended agent: ${chalk.bold(evaluation.agentType)}`);
      console.log(`📊 Confidence: ${(evaluation.confidence * 100).toFixed(1)}%`);
      console.log(`💭 Reasoning: ${evaluation.reasoning}`);
      
      if (options.verbose) {
        console.log(`\n📋 Evaluation Details:`);
        console.log(`  • Evaluation ID: ${evaluation.metadata.evaluationId.slice(0, 12)}...`);
        console.log(`  • Processing time: ${evaluation.metadata.processingTimeMs}ms`);
        console.log(`  • Rules applied: ${evaluation.metadata.rulesApplied.length}`);
        
        if (evaluation.alternatives.length > 0) {
          console.log(`\n🔄 Alternatives:`);
          evaluation.alternatives.forEach((alt, i) => {
            console.log(`  ${i + 1}. ${alt.agentType} (${(alt.confidence * 100).toFixed(1)}%) - ${alt.reasoning}`);
          });
        }
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Routing evaluation failed: ${error}`));
      process.exitCode = 1;
    }
  }));

routerCmd
  .command('rules')
  .description('Manage routing rules')
  .option('-l, --list', 'List all routing rules')
  .option('-a, --add <file>', 'Add rule from JSON file')
  .option('-d, --delete <id>', 'Delete rule by ID')
  .option('-e, --enable <id>', 'Enable rule by ID')
  .option('-x, --disable <id>', 'Disable rule by ID')
  .option('-v, --verbose', 'Show detailed rule information')
  .action(handleCommand('router.rules', async (options) => {
    const router = new RoutingPolicyService();
    try {
      if (options.list) {
        const rules = router.getAllRules();
        console.log(chalk.cyan(`📋 Routing Rules (${rules.length} total):`));
        
        if (rules.length === 0) {
          console.log(chalk.gray('  No rules configured'));
          return;
        }
        
        rules.forEach(rule => {
          const status = rule.metadata.enabled ? chalk.green('✓') : chalk.red('✗');
          console.log(`  ${status} ${chalk.bold(rule.name)} (${rule.id})`);
          console.log(`    Precedence: ${rule.precedence}, Confidence: ${(rule.confidence * 100).toFixed(1)}%`);
          console.log(`    Target: ${rule.target}, Description: ${rule.description}`);
          
          if (options.verbose) {
            console.log(`    Keywords: ${rule.conditions.keywords?.join(', ') || 'none'}`);
            console.log(`    Patterns: ${rule.conditions.patterns?.join(', ') || 'none'}`);
            console.log(`    Created: ${rule.metadata.created.toISOString()}`);
          }
          console.log('');
        });
      } else if (options.add) {
        const ruleData = JSON.parse(require('fs').readFileSync(options.add, 'utf8'));
        const rule = await router.addRule(ruleData);
        console.log(chalk.green(`✅ Rule added: ${rule.name} (${rule.id})`));
      } else if (options.delete) {
        const deleted = await router.deleteRule(options.delete);
        if (deleted) {
          console.log(chalk.green(`✅ Rule deleted: ${options.delete}`));
        } else {
          console.log(chalk.yellow(`⚠️  Rule not found: ${options.delete}`));
        }
      } else if (options.enable) {
        const rule = await router.updateRule(options.enable, { 
          metadata: { enabled: true } as any 
        });
        if (rule) {
          console.log(chalk.green(`✅ Rule enabled: ${rule.name}`));
        } else {
          console.log(chalk.yellow(`⚠️  Rule not found: ${options.enable}`));
        }
      } else if (options.disable) {
        const rule = await router.updateRule(options.disable, { 
          metadata: { enabled: false } as any 
        });
        if (rule) {
          console.log(chalk.yellow(`⚠️  Rule disabled: ${rule.name}`));
        } else {
          console.log(chalk.yellow(`⚠️  Rule not found: ${options.disable}`));
        }
      } else {
        console.log(chalk.yellow('⚠️  Please specify an action: --list, --add, --delete, --enable, or --disable'));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Router operation failed: ${error}`));
      process.exitCode = 1;
    }
  }));

routerCmd
  .command('history')
  .description('Show routing evaluation history')
  .option('-l, --limit <count>', 'Number of entries to show', '10')
  .option('-v, --verbose', 'Show detailed evaluation information')
  .action(handleCommand('router.history', async (options) => {
    const router = new RoutingPolicyService();
    try {
      const limit = parseInt(options.limit);
      const history = router.getEvaluationHistory(limit);
      
      console.log(chalk.cyan(`📊 Routing History (last ${history.length} evaluations):`));
      
      if (history.length === 0) {
        console.log(chalk.gray('  No evaluation history found'));
        return;
      }
      
      history.forEach((evaluation, i) => {
        const timestamp = evaluation.metadata.timestamp.toLocaleString();
        console.log(`\n${i + 1}. ${chalk.bold(evaluation.agentType)} (${timestamp})`);
        console.log(`   Confidence: ${(evaluation.confidence * 100).toFixed(1)}%`);
        console.log(`   Reasoning: ${evaluation.reasoning}`);
        
        if (options.verbose) {
          console.log(`   Evaluation ID: ${evaluation.metadata.evaluationId.slice(0, 12)}...`);
          console.log(`   Processing time: ${evaluation.metadata.processingTimeMs}ms`);
          console.log(`   Rules applied: ${evaluation.metadata.rulesApplied.join(', ') || 'none'}`);
          if (evaluation.alternatives.length > 0) {
            console.log(`   Alternatives: ${evaluation.alternatives.map(a => a.agentType).join(', ')}`);
          }
        }
      });
    } catch (error) {
      console.error(chalk.red(`❌ Failed to retrieve history: ${error}`));
      process.exitCode = 1;
    }
  }));

// Agent commands
const agentCmd = program.command('agent').description('Agent management commands');

agentCmd
  .command('list')
  .description('List all registered agents')
  .action(handleCommand('agent.list', async () => {
    await useSystem('agent list', async (system) => {
      const agents = system.getAgentRegistry().getAllAgents();
      renderAgentTable(agents);
    });
  }));

agentCmd
  .command('deploy')
  .description('Deploy new agents of a given type')
  .option('-t, --type <type>', 'Agent type')
  .option('-r, --replicas <count>', 'Number of replicas', '1')
  .action(handleCommand('agent.deploy', async (options) => {
    await useSystem('agent deploy', async (system) => {
      let agentType = options.type as AgentType;
      if (!agentType || !Object.values(AgentType).includes(agentType)) {
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'type',
            message: 'Select agent type:',
            choices: Object.values(AgentType)
          }
        ]);
        agentType = answer.type;
      }

      const replicas = parseInteger(options.replicas, 'replicas');
      await system.deployAgent(agentType, replicas);
      console.log(chalk.green(`✅ Deployed ${replicas} ${agentType} agent(s).`));
    });
  }));

agentCmd
  .command('status <agentId>')
  .description('Show status for a specific agent id')
  .action(handleCommand('agent.status', async (agentId: string) => {
    await useSystem('agent status', async (system) => {
      const agent = system.getAgentRegistry().getAgentByStringId(agentId);
      if (!agent) {
        console.log(chalk.red(`Agent ${agentId} not found.`));
        return;
      }

      console.log(chalk.blue(`👤 Agent ${agentId}`));
      console.log(`  Type: ${agent.id.type}`);
      console.log(`  Status: ${agent.status}`);
      console.log(`  Capabilities: ${agent.capabilities.map((cap) => cap.name).join(', ')}`);
      console.log(`  Resources: CPU ${agent.resources.cpu} | RAM ${agent.resources.memory}MB`);
      console.log(`  Last Updated: ${agent.lastUpdated.toISOString()}`);
    });
  }));

// Mesh commands
const meshCmd = program.command('mesh').description('Neural mesh management');

meshCmd
  .command('configure')
  .description('Configure the neural mesh topology')
  .option('-n, --nodes <count>', 'Desired node count', '5')
  .option('-t, --topology <type>', 'Topology type', 'mesh')
  .option('-c, --connections <count>', 'Max connections per node', '5')
  .action(handleCommand('mesh.configure', async (options) => {
    await useSystem('mesh configure', async (system) => {
      await system.createNeuralMesh(options.topology, parseInteger(options.nodes, 'nodes'));
      if (options.connections) {
        system.getNeuralMesh().configure({ maxConnections: parseInteger(options.connections, 'connections') });
      }
      console.log(chalk.green('✅ Neural mesh configuration applied.'));
      renderMeshStatus(system.getNeuralMesh().getStatus());
    });
  }));

meshCmd
  .command('status')
  .description('Show neural mesh status')
  .action(handleCommand('mesh.status', async () => {
    await useSystem('mesh status', async (system) => {
      renderMeshStatus(system.getNeuralMesh().getStatus());
    });
  }));

// Swarm commands
const swarmCmd = program.command('swarm').description('Swarm coordination commands');

swarmCmd
  .command('start')
  .description('Start swarm coordination with a specific algorithm')
  .option('-a, --algorithm <type>', 'Algorithm type', 'pso')
  .option('-o, --objective <value...>', 'Optimization objectives (repeatable)')
  .action(handleCommand('swarm.start', async (options) => {
    await useSystem('swarm start', async (system) => {
      const objectives = Array.isArray(options.objective) ? options.objective : (options.objective ? [options.objective] : []);
      await system.startSwarm(options.algorithm, objectives);
      console.log(chalk.green('✅ Swarm coordination started.'));
      renderSwarmStatus(system.getSwarmCoordinator().getStatus());
    });
  }));

swarmCmd
  .command('stop')
  .description('Stop swarm coordination')
  .action(handleCommand('swarm.stop', async () => {
    await useSystem('swarm stop', async (system) => {
      system.getSwarmCoordinator().stopSwarm();
      console.log(chalk.green('✅ Swarm coordination stopped.'));
    });
  }));

swarmCmd
  .command('status')
  .description('Show swarm status')
  .action(handleCommand('swarm.status', async () => {
    await useSystem('swarm status', async (system) => {
      renderSwarmStatus(system.getSwarmCoordinator().getStatus());
    });
  }));

// Bridge commands
const bridgeCmd = program.command('bridge').description('Bridge management');

bridgeCmd
  .command('mcp-send')
  .description('Send a message over the MCP bridge')
  .requiredOption('-e, --endpoint <endpoint>', 'Registered MCP endpoint')
  .requiredOption('-p, --payload <json>', 'JSON payload to send')
  .action(handleCommand('bridge.mcp.send', async (options) => {
    await useSystem('mcp send', async (system) => {
      const payload = parseJsonInput(options.payload, 'payload');
      const response = await system.sendMcpMessage(options.endpoint, payload);
      console.log(chalk.green('✅ MCP message delivered. Response:'));
      console.log(JSON.stringify(response, null, 2));
    });
  }));

bridgeCmd
  .command('a2a-send <targetId>')
  .description('Dispatch an A2A message to a target agent')
  .requiredOption('-m, --message <json>', 'Message payload JSON')
  .option('-f, --from <agentId>', 'Optional sending agent id')
  .action(handleCommand('bridge.a2a.send', async (targetId: string, options) => {
    await useSystem('a2a send', async (system) => {
      const payload = parseJsonInput(options.message, 'message');
      const sender = options.from ? system.getAgentRegistry().getAgentByStringId(options.from)?.id : undefined;
      await system.sendA2AMessage(targetId, payload, sender);
      console.log(chalk.green(`✅ A2A message sent to ${targetId}.`));
    });
  }));

// Consensus commands
const consensusCmd = program.command('consensus').description('Consensus management commands');

consensusCmd
  .command('propose')
  .description('Create a consensus proposal')
  .argument('<type>', 'Proposal type')
  .argument('<data>', 'Proposal data JSON')
  .option('-p, --proposer <agentId>', 'Override proposer agent id')
  .action(handleCommand('consensus.propose', async (type: string, data: string, options) => {
    await useSystem('consensus propose', async (system) => {
      const payload = parseJsonInput(data, 'data');
      const proposer = options.proposer
        ? system.getAgentRegistry().getAgentByStringId(options.proposer)?.id
        : undefined;
      const proposalId = await system.proposeConsensus(type, payload, proposer);
      console.log(chalk.green(`✅ Consensus proposal created: ${proposalId}`));
    });
  }));

consensusCmd
  .command('vote')
  .description('Submit a vote for a proposal')
  .argument('<proposalId>', 'Proposal ID')
  .argument('<vote>', 'Vote (yes/no)')
  .option('-v, --voter <agentId>', 'Override voter agent id')
  .action(handleCommand('consensus.vote', async (proposalId: string, vote: string, options) => {
    await useSystem('consensus vote', async (system) => {
      const normalized = vote.toLowerCase();
      if (!['yes', 'no'].includes(normalized)) {
        throw new Error('Vote must be "yes" or "no"');
      }
      const voter = options.voter
        ? system.getAgentRegistry().getAgentByStringId(options.voter)?.id
        : undefined;
      system.submitConsensusVote(proposalId, normalized === 'yes', voter);
      console.log(chalk.green('✅ Vote submitted.'));
    });
  }));

consensusCmd
  .command('status')
  .description('Show consensus manager status')
  .action(handleCommand('consensus.status', async () => {
    await useSystem('consensus status', async (system) => {
      renderConsensusStatus(system);
    });
  }));

// Task commands
const taskCmd = program.command('task').description('Workflow and task management');

taskCmd
  .command('submit')
  .description('Submit a natural-language workflow prompt for execution')
  .argument('<prompt...>', 'Prompt describing the workflow')
  .option('-s, --silent', 'Skip final artifact dump')
  .action(handleCommand('task.submit', async (promptParts: string[], options) => {
    const prompt = promptParts.join(' ').trim();
    if (!prompt) {
      throw new Error('Prompt cannot be empty');
    }

    await useSystem('task submit', async (system) => {
      console.log(chalk.blue('🧩 Executing workflow...'));
      const onStageStarted = (event: any) => {
        console.log(chalk.gray(`  ▶ Stage ${event.label} (${event.taskType}) started.`));
      };
      const onStageCompleted = (event: any) => {
        console.log(chalk.cyan(`  ✔ Stage ${event.label} (${event.taskId}) completed.`));
        if (event.result?.summary) {
          console.log(chalk.gray(`    Summary: ${event.result.summary}`));
        }
      };
      const onStageFailed = (event: any) => {
        console.log(chalk.red(`  ✖ Stage ${event.label} failed: ${event.error}`));
      };
      system.on('workflowStageStarted', onStageStarted);
      system.on('workflowStageCompleted', onStageCompleted);
      system.on('workflowStageFailed', onStageFailed);
      try {
        const outcome = await system.executeTask(prompt);
        console.log(chalk.green('✅ Workflow complete.'));
        if (!options.silent) {
          console.log(JSON.stringify(outcome, null, 2));
        }
      } finally {
        system.off('workflowStageStarted', onStageStarted);
        system.off('workflowStageCompleted', onStageCompleted);
        system.off('workflowStageFailed', onStageFailed);
      }
    });
  }));

taskCmd
  .command('recent')
  .description('Show recent task outcomes from this session')
  .action(handleCommand('task.recent', async () => {
    const snapshot = session.getTelemetry();
    if (!snapshot.recentTasks.length) {
      console.log(chalk.gray('No tasks executed yet in this session.'));
      return;
    }
    console.log(chalk.blue('🗂 Recent tasks')); 
    for (const item of snapshot.recentTasks) {
      console.log(`  • ${item.id} [${item.status}] — ${item.summary}`);
    }
  }));

// Hive-mind commands (leveraging existing workflow orchestration)
const hiveMindCmd = program.command('hive-mind').description('Hive-mind coordination and spawning');

hiveMindCmd
  .command('spawn')
  .description('Spawn a coordinated hive-mind workflow from a prompt')
  .argument('<prompt...>', 'Natural language description of the task/goal')
  .option('--codex', 'Augment the prompt with Codex context from AGENTS.md, README, and local artifacts')
  .option('--agents <count>', 'Number of agents to target', '5')
  .option('--max-agents <count>', 'Maximum number of agents allowed', '10')
  .option('--max-workers <count>', 'Maximum worker agents', '7')
  .option('--algorithm <type>', 'Swarm algorithm (pso|aco|flocking|hybrid)', 'pso')
  .option('--mesh-topology <type>', 'Mesh topology (mesh|ring|star|hierarchical)', 'mesh')
  .option('--consensus <type>', 'Consensus mechanism (raft|byzantine)', 'byzantine')
  .option('--priority <level>', 'Task priority (1-10)', '7')
  .option('--timeout <seconds>', 'Timeout in seconds', '600')
  .option('--auto-scale', 'Enable auto-scaling based on workload')
  .option('--queen-coordinator', 'Deploy dedicated queen coordinator')
  .option('--fault-tolerance', 'Enable fault-tolerant operation')
  .option('--mcp', 'Enable MCP bridge connections')
  .option('--debug', 'Enable debug logging')
  .option('--dry-run', 'Preview Codex context without executing the hive-mind spawn')
  .option('--yaml', 'Output results in YAML format (default: JSON)')
  .action(handleCommand('hive-mind.spawn', async (promptParts: string[], options) => {
    let prompt = promptParts.join(' ').trim();
    if (!prompt) {
      throw new Error('Prompt cannot be empty');
    }

    if (options.dryRun && !options.codex) {
      throw new Error('--dry-run can only be used together with --codex');
    }

    const originalPrompt = prompt;
    let codexContext: CodexContext | undefined;
    let codexMetadata: CodexContextAggregationMetadata | undefined;
    let codexEnvelope: CodexPromptEnvelope | undefined;

    if (options.codex) {
      const builder = new CodexContextBuilder(process.cwd());
      await builder.withAgentDirectives();
      await builder.withReadmeExcerpts();
      await builder.withDirectoryInventory();
      await builder.withDatabaseMetadata();
      const buildResult: CodexContextBuildResult = await builder.build();

      codexContext = buildResult.context;
      codexMetadata = buildResult.metadata;

      emitContextLogs(buildResult.logs);
      emitContextSummary(buildResult.context, buildResult.metadata);

      const contextBlock = renderCodexContextBlock(buildResult.context);
      const enrichedPrompt = composePromptWithContext(originalPrompt, buildResult.context);

      codexEnvelope = {
        originalPrompt,
        enrichedPrompt,
        contextBlock
      };

      if (options.dryRun) {
        console.log(chalk.yellow('⚙️  Dry-run: Codex context ready. Skipping hive-mind orchestration.'));
        console.log('');
        console.log(chalk.gray(contextBlock));
        return;
      }

      prompt = enrichedPrompt;
      console.log(chalk.cyan('📚 Codex context attached to hive-mind prompt.'));
    }

    const config = {
      agents: parseInteger(options.agents, 'agents'),
      maxAgents: options.maxAgents ? parseInteger(options.maxAgents, 'maxAgents') : 10,
      maxWorkers: options.maxWorkers ? parseInteger(options.maxWorkers, 'maxWorkers') : 7,
      algorithm: options.algorithm,
      meshTopology: options.meshTopology || 'mesh',
      consensus: options.consensus,
      priority: options.priority ? parseInteger(options.priority, 'priority') : 7,
      timeout: options.timeout ? parseInteger(options.timeout, 'timeout') * 1000 : 600000,
      autoScale: !!options.autoScale,
      queenCoordinator: !!options.queenCoordinator,
      faultTolerance: !!options.faultTolerance,
      mcp: !!options.mcp,
      debug: !!options.debug,
      codex: codexContext
        ? {
            enabled: true,
            contextHash: codexContext.contextHash,
            sizeBytes: codexContext.sizeBytes,
            agentGuides: codexMetadata?.agentGuideCount ?? 0,
            directories: codexMetadata?.codexDirectoryCount ?? 0,
            databases: codexMetadata?.databaseCount ?? 0
          }
        : { enabled: false }
    };

    await useSystem('hive-mind spawn', async (system) => {
      console.log(chalk.blue('🧠 Initializing hive-mind orchestration...'));
      console.log(chalk.gray(`Configuration: ${JSON.stringify(config, null, 2)}`));

      if (codexContext && codexEnvelope) {
        await primeCodexWithRetry(system, codexContext, codexEnvelope);
      }

      // Phase 1: Infrastructure Setup
      console.log(chalk.cyan('📡 Phase 1: Infrastructure Setup'));
      
      // Configure neural mesh topology
      await system.createNeuralMesh(config.meshTopology, config.agents);
      console.log(chalk.green(`  ✓ Neural mesh configured (${config.meshTopology}, ${config.agents} nodes)`));

      // Deploy coordinators first
      if (config.queenCoordinator) {
        await system.deployAgent(AgentType.SWARM_COORDINATOR, 1);
        await system.deployAgent(AgentType.TOPOLOGY_COORDINATOR, 1);
        console.log(chalk.green('  ✓ Queen coordinator deployed'));
      }

      // Deploy consensus coordinators
      await system.deployAgent(AgentType.CONSENSUS_COORDINATOR, 1);
      console.log(chalk.green(`  ✓ Consensus coordinator deployed (${config.consensus})`));

      // Phase 2: Agent Deployment
      console.log(chalk.cyan('🤖 Phase 2: Agent Deployment'));
      
      // Calculate optimal worker distribution
      const workerTypes = [AgentType.CODE_WORKER, AgentType.DATA_WORKER, AgentType.VALIDATION_WORKER];
      const workersPerType = Math.floor(Math.min(config.maxWorkers, config.agents - 3) / workerTypes.length);
      
      for (const workerType of workerTypes) {
        if (workersPerType > 0) {
          await system.deployAgent(workerType, workersPerType);
          console.log(chalk.green(`  ✓ Deployed ${workersPerType} ${workerType} agents`));
        }
      }

      // Phase 3: Bridge Configuration
      if (config.mcp) {
        console.log(chalk.cyan('🌉 Phase 3: Bridge Configuration'));
        await system.deployAgent(AgentType.MCP_BRIDGE, 1);
        await system.deployAgent(AgentType.A2A_BRIDGE, 1);
        console.log(chalk.green('  ✓ MCP and A2A bridges activated'));
      }

      // Phase 4: Swarm Activation
      console.log(chalk.cyan('🐝 Phase 4: Swarm Activation'));
      
      const objectives = ['code_quality', 'execution_speed', 'resource_efficiency'];
      if (config.faultTolerance) {
        objectives.push('fault_tolerance');
      }
      
      await system.startSwarm(config.algorithm, objectives);
      console.log(chalk.green(`  ✓ Swarm activated (${config.algorithm}, objectives: ${objectives.join(', ')})`));

      // Phase 5: Task Execution
      console.log(chalk.cyan('⚡ Phase 5: Task Execution'));
      console.log(chalk.blue(`Executing: "${prompt}"`));

      const startTime = Date.now();
      const onStageStarted = (event: any) => {
        console.log(chalk.gray(`    ▶ ${event.label} started (${event.taskType})`));
      };
      const onStageCompleted = (event: any) => {
        const elapsed = Date.now() - startTime;
        console.log(chalk.green(`    ✓ ${event.label} completed (+${elapsed}ms)`));
      };
      const onStageFailed = (event: any) => {
        console.log(chalk.red(`    ✗ ${event.label} failed: ${event.error}`));
      };

      system.on('workflowStageStarted', onStageStarted);
      system.on('workflowStageCompleted', onStageCompleted);
      system.on('workflowStageFailed', onStageFailed);

      try {
        const outcome = await Promise.race([
          system.executeTask(prompt),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Hive-mind execution timeout')), config.timeout))
        ]);

        const totalTime = Date.now() - startTime;
        console.log(chalk.green(`\n🎉 Hive-mind execution completed in ${totalTime}ms`));
        
        // Collect system status information
        const swarmStatus = system.getSwarmCoordinator().getStatus();
        const meshStatus = system.getNeuralMesh().getStatus();
        const agentRegistry = system.getAgentRegistry().getStatus();
        
        // Prepare comprehensive result data
        const resultData = {
          executionId: `exec-${Date.now()}`,
          status: 'completed',
          duration: totalTime,
          originalPrompt,
          summary: (outcome as any).summary,
          artifacts: (outcome as any).artifacts || {},
          stages: (outcome as any).stages || [],
          agentCount: agentRegistry.totalAgents,
          taskCount: (outcome as any).stages?.length || 0,
          meshStatus: {
            nodeCount: meshStatus.nodeCount,
            connectionCount: meshStatus.connectionCount
          },
          consensusStatus: {
            totalVotes: 0 // Would need to be tracked from actual consensus operations
          },
          swarmStatus: {
            algorithm: swarmStatus.algorithm,
            isOptimizing: swarmStatus.isOptimizing
          },
          codexContext: codexContext ? {
            enabled: true,
            contextHash: codexContext.contextHash,
            sizeBytes: codexContext.sizeBytes
          } : { enabled: false }
        };

        // Output results based on format preference
        if (options.yaml) {
          console.log(chalk.blue('\n📋 Results (YAML format):'));
          const yamlOutput = HiveMindYamlFormatter.formatExecutionResult(resultData);
          console.log(yamlOutput);
        } else {
          // Display comprehensive results in human-readable format
          console.log(chalk.blue('\n📊 Execution Summary'));
          console.log(chalk.white('Summary:'), (outcome as any).summary);
          
          if ((outcome as any).artifacts?.code) {
            console.log(chalk.blue('\n💻 Generated Code Artifacts:'));
            console.log(chalk.gray((outcome as any).artifacts.code.substring(0, 500) + '...'));
          }
          
          if ((outcome as any).stages && Array.isArray((outcome as any).stages)) {
            console.log(chalk.blue('\n🔄 Stage Results:'));
            (outcome as any).stages.forEach((stage: any, idx: number) => {
              console.log(chalk.cyan(`  ${idx + 1}. ${stage.stage} (${stage.taskId})`));
              if (stage.result?.summary) {
                console.log(chalk.gray(`     ${stage.result.summary}`));
              }
            });
          }

          // System metrics
          console.log(chalk.blue('\n📈 System Metrics:'));
          console.log(chalk.white(`  Agents: ${agentRegistry.totalAgents} active`));
          console.log(chalk.white(`  Mesh: ${meshStatus.nodeCount} nodes, ${meshStatus.connectionCount} connections`));
          console.log(chalk.white(`  Swarm: ${swarmStatus.algorithm}, optimizing=${swarmStatus.isOptimizing}`));
          console.log(chalk.white(`  Execution time: ${totalTime}ms`));
        }

        if (!config.debug && !options.yaml) {
          console.log(chalk.blue('\n💾 Results saved to session telemetry'));
        } else if (config.debug && !options.yaml) {
          console.log(chalk.blue('\n🔍 Full Debug Output:'));
          console.log(JSON.stringify(outcome, null, 2));
        }

      } finally {
        system.off('workflowStageStarted', onStageStarted);
        system.off('workflowStageCompleted', onStageCompleted);
        system.off('workflowStageFailed', onStageFailed);
      }
    });
  }));

hiveMindCmd
  .command('status')
  .description('Show status of active hive-mind swarms')
  .option('--yaml', 'Output status in YAML format')
  .action(handleCommand('hive-mind.status', async (options) => {
    await useSystem('hive-mind status', async (system) => {
      const systemStatus = {
        ready: system.isReady(),
        uptime: Date.now() - (system as any).startTime?.getTime() || 0,
        agents: system.getAgentRegistry().getStatus(),
        mesh: system.getNeuralMesh().getStatus(),
        swarm: system.getSwarmCoordinator().getStatus(),
        consensus: system.getConsensusManager().getStatus()
      };

      if (options.yaml) {
        const yamlOutput = HiveMindYamlFormatter.formatSystemStatus(systemStatus);
        console.log(yamlOutput);
      } else {
        renderSwarmStatus(systemStatus.swarm);
      }
    });
  }));

hiveMindCmd
  .command('terminate')
  .description('Terminate swarm coordination and reset mesh links')
  .action(handleCommand('hive-mind.terminate', async () => {
    await useSystem('hive-mind terminate', async (system) => {
      system.getSwarmCoordinator().stopSwarm();
      console.log(chalk.green('✅ Hive-mind swarms halted. Resources remain available.'));
    });
  }));

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode')
  .action(handleCommand('interactive', async () => {
    await useSystem('interactive', async (system) => {
      console.log(chalk.green('🎛️  Welcome to Codex-Synaptic Interactive Mode!'));
      let exit = false;
      while (!exit) {
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'Select an action:',
            choices: [
              'System status',
              'List agents',
              'Submit workflow',
              'Show telemetry',
              'Exit'
            ]
          }
        ]);

        switch (action) {
          case 'System status':
            renderTelemetry();
            break;
          case 'List agents':
            renderAgentTable(system.getAgentRegistry().getAllAgents());
            break;
          case 'Submit workflow': {
            const { prompt } = await inquirer.prompt([
              {
                type: 'input',
                name: 'prompt',
                message: 'Workflow prompt:'
              }
            ]);
            if (prompt) {
              const outcome = await system.executeTask(prompt);
              console.log(chalk.green('✅ Workflow complete.'));
              console.log(outcome.summary);
            }
            break;
          }
          case 'Show telemetry':
            renderTelemetry();
            break;
          case 'Exit':
            exit = true;
            break;
        }
      }
    });
  }));

// Global error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str))
});

program.exitOverride();

try {
  program.parse();
} catch (err: any) {
  if (err.code === 'commander.helpDisplayed') {
    process.exit(0);
  } else if (err.code === 'commander.version') {
    process.exit(0);
  } else {
    console.error(chalk.red('CLI Error:'), err.message);
    process.exit(1);
  }
}
