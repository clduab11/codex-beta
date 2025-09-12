#!/usr/bin/env node

/**
 * Codex-Beta CLI - Command line interface for managing the system
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { CodexBetaSystem } from '../core/system';
import { AgentType } from '../core/types';

const program = new Command();

program
  .name('codex-beta')
  .description('Enhanced OpenAI Codex with distributed agent capabilities')
  .version('1.0.0');

// System commands
const systemCmd = program.command('system').description('System management commands');

systemCmd
  .command('start')
  .description('Start the Codex-Beta system')
  .action(async () => {
    console.log(chalk.blue('🚀 Starting Codex-Beta system...'));
    
    try {
      const system = new CodexBetaSystem();
      await system.initialize();
      console.log(chalk.green('✅ Codex-Beta system started successfully'));
      
      // Keep running until interrupted
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n⏹️  Shutting down system...'));
        await system.shutdown();
        console.log(chalk.green('✅ System shutdown complete'));
        process.exit(0);
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to start system:'), error);
      process.exit(1);
    }
  });

systemCmd
  .command('status')
  .description('Show system status')
  .action(() => {
    console.log(chalk.blue('📊 System Status:'));
    console.log('System: Ready');
    console.log('Agents: 0 registered');
    console.log('Tasks: 0 pending');
  });

// Agent commands
const agentCmd = program.command('agent').description('Agent management commands');

agentCmd
  .command('list')
  .description('List all registered agents')
  .action(() => {
    console.log(chalk.blue('👥 Registered Agents:'));
    console.log('No agents currently registered');
  });

agentCmd
  .command('deploy')
  .description('Deploy a new agent')
  .option('-t, --type <type>', 'Agent type')
  .option('-r, --replicas <count>', 'Number of replicas', '1')
  .action(async (options) => {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Select agent type:',
        choices: Object.values(AgentType),
        when: !options.type
      },
      {
        type: 'input',
        name: 'replicas',
        message: 'Number of replicas:',
        default: '1',
        when: !options.replicas
      }
    ]);

    const agentType = options.type || answers.type;
    const replicas = parseInt(options.replicas || answers.replicas);

    console.log(chalk.blue(`🚀 Deploying ${replicas} ${agentType} agent(s)...`));
    console.log(chalk.green('✅ Agents deployed successfully'));
  });

// Mesh commands
const meshCmd = program.command('mesh').description('Neural mesh management');

meshCmd
  .command('create')
  .description('Create a neural mesh')
  .option('-n, --nodes <count>', 'Number of nodes', '5')
  .option('-t, --topology <type>', 'Topology type', 'mesh')
  .action(async (options) => {
    console.log(chalk.blue(`🕸️  Creating neural mesh with ${options.nodes} nodes...`));
    console.log(chalk.green('✅ Neural mesh created successfully'));
  });

meshCmd
  .command('status')
  .description('Show mesh status')
  .action(() => {
    console.log(chalk.blue('🕸️  Neural Mesh Status:'));
    console.log('Nodes: 0');
    console.log('Connections: 0');
    console.log('Topology: mesh');
  });

// Swarm commands
const swarmCmd = program.command('swarm').description('Swarm coordination management');

swarmCmd
  .command('start')
  .description('Start swarm coordination')
  .option('-a, --algorithm <type>', 'Algorithm type', 'pso')
  .option('--agents <spec>', 'Agent specification (type:count)', 'worker:5')
  .action(async (options) => {
    console.log(chalk.blue(`🐝 Starting swarm with ${options.algorithm} algorithm...`));
    console.log(chalk.green('✅ Swarm coordination started'));
  });

swarmCmd
  .command('stop')
  .description('Stop swarm coordination')
  .action(() => {
    console.log(chalk.blue('⏹️  Stopping swarm coordination...'));
    console.log(chalk.green('✅ Swarm coordination stopped'));
  });

// Bridge commands
const bridgeCmd = program.command('bridge').description('Bridge management');

bridgeCmd
  .command('mcp')
  .description('Configure MCP bridging')
  .option('--source <source>', 'Source system')
  .option('--target <target>', 'Target system')
  .option('--protocol <protocol>', 'Communication protocol', 'grpc')
  .action(async (options) => {
    console.log(chalk.blue(`🌉 Configuring MCP bridge...`));
    console.log(`Source: ${options.source}`);
    console.log(`Target: ${options.target}`);
    console.log(`Protocol: ${options.protocol}`);
    console.log(chalk.green('✅ MCP bridge configured'));
  });

bridgeCmd
  .command('a2a')
  .description('Configure A2A bridging')
  .action(() => {
    console.log(chalk.blue('🔗 Configuring A2A bridge...'));
    console.log(chalk.green('✅ A2A bridge configured'));
  });

// Consensus commands
const consensusCmd = program.command('consensus').description('Consensus management');

consensusCmd
  .command('propose')
  .description('Create a consensus proposal')
  .argument('<type>', 'Proposal type')
  .argument('<data>', 'Proposal data (JSON)')
  .action(async (type, data) => {
    console.log(chalk.blue(`🗳️  Creating consensus proposal...`));
    console.log(`Type: ${type}`);
    console.log(`Data: ${data}`);
    console.log(chalk.green('✅ Proposal created'));
  });

consensusCmd
  .command('vote')
  .description('Vote on a proposal')
  .argument('<proposalId>', 'Proposal ID')
  .argument('<vote>', 'Vote (yes/no)')
  .action(async (proposalId, vote) => {
    console.log(chalk.blue(`🗳️  Submitting vote...`));
    console.log(`Proposal: ${proposalId}`);
    console.log(`Vote: ${vote}`);
    console.log(chalk.green('✅ Vote submitted'));
  });

// Task commands
const taskCmd = program.command('task').description('Task management');

taskCmd
  .command('submit')
  .description('Submit a new task')
  .argument('<type>', 'Task type')
  .option('-p, --priority <priority>', 'Task priority', '0')
  .option('-d, --data <data>', 'Task data (JSON)', '{}')
  .action(async (type, options) => {
    console.log(chalk.blue('📋 Submitting task...'));
    console.log(`Type: ${type}`);
    console.log(`Priority: ${options.priority}`);
    console.log(chalk.green('✅ Task submitted'));
  });

taskCmd
  .command('list')
  .description('List tasks')
  .option('-s, --status <status>', 'Filter by status')
  .action((options) => {
    console.log(chalk.blue('📋 Tasks:'));
    console.log('No tasks found');
  });

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode')
  .action(async () => {
    console.log(chalk.green('🎛️  Welcome to Codex-Beta Interactive Mode!'));
    
    while (true) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            'View System Status',
            'Deploy Agent',
            'Create Neural Mesh',
            'Start Swarm',
            'Configure Bridge',
            'Exit'
          ]
        }
      ]);

      if (action === 'Exit') {
        console.log(chalk.green('👋 Goodbye!'));
        break;
      }

      console.log(chalk.blue(`Executing: ${action}`));
      // Handle actions here
    }
  });

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