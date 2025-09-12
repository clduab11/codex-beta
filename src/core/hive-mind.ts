
import { AgentType } from './types';
import { CodexBetaSystem } from './system';
import * as fs from 'fs';

export async function executeHiveMindSpawn(prompt: string, options: any): Promise<void> {
  const system = new CodexBetaSystem();
  await system.initialize();

  const agentComposition = analyzePromptForAgents(prompt);

  // Deploy agents
  for (const agent of agentComposition) {
    await system.deployAgent(agent.type, agent.count);
  }

  // Create neural mesh
  await system.createNeuralMesh(options.meshTopology, options.agents);

  // Start swarm
  await system.startSwarm(options.algorithm);

  // Execute task
  const results = await system.executeTask(prompt);

  // Save results
  fs.writeFileSync('./hive-mind-results.json', JSON.stringify(results, null, 2));

  await system.shutdown();
}

export function analyzePromptForAgents(prompt: string): Array<{ type: AgentType, count: number }> {
  const promptLower = prompt.toLowerCase();
  const composition: Array<{ type: AgentType, count: number }> = [];

  if (promptLower.includes('code') || promptLower.includes('program') || promptLower.includes('develop')) {
    composition.push({ type: AgentType.CODE_WORKER, count: 3 });
  }

  if (promptLower.includes('data') || promptLower.includes('analyze') || promptLower.includes('process')) {
    composition.push({ type: AgentType.DATA_WORKER, count: 2 });
  }

  if (promptLower.includes('test') || promptLower.includes('validate') || promptLower.includes('check')) {
    composition.push({ type: AgentType.VALIDATION_WORKER, count: 1 });
  }

  // Always include coordinators for hive-mind
  composition.push({ type: AgentType.SWARM_COORDINATOR, count: 1 });
  composition.push({ type: AgentType.TOPOLOGY_COORDINATOR, count: 1 });

  return composition.length > 2 ? composition : [
    { type: AgentType.CODE_WORKER, count: 2 },
    { type: AgentType.DATA_WORKER, count: 1 },
    { type: AgentType.SWARM_COORDINATOR, count: 1 }
  ];
}
