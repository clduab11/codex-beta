import { CodexWorker, AgentType, TaskResult } from './worker-types.js';
import { CoordinationEngine, CoordinationStrategy, PlanStep } from '../coordination/coordination-engine.js';
import { CodexMemorySystem } from '../memory/memory-system.js';

export class CodexQueen {
  private workers: Map<string, CodexWorker> = new Map();
  private coordination: CoordinationEngine;
  private memory: CodexMemorySystem;

  constructor() {
    this.coordination = new CoordinationEngine();
    this.memory = new CodexMemorySystem();
  }

  async spawnWorker(type: AgentType, capabilities: string[]) {
    const worker = new CodexWorker(type, capabilities);
    await worker.initialize();
    this.workers.set(worker.id, worker);
    return worker;
  }

  async orchestrateTask(task: string, strategy: CoordinationStrategy) {
    const plan = await this.coordination.createPlan(task, strategy);
    const results = await this.executeParallel(plan);
    return this.synthesizeResults(results);
  }

  private async executeParallel(plan: PlanStep[]): Promise<TaskResult[]> {
    const results: TaskResult[] = [];
    for (const step of plan) {
      const worker = this.workers.values().next().value as CodexWorker | undefined;
      if (worker) {
        results.push(await worker.processTask({ description: step.description }));
      }
    }
    return results;
  }

  private synthesizeResults(results: TaskResult[]) {
    return results[0];
  }
}
