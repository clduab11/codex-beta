export enum CoordinationStrategy {
  PARALLEL = 'parallel',
  SEQUENTIAL = 'sequential'
}

export interface PlanStep {
  description: string;
}

export class CoordinationEngine {
  async createPlan(task: string, _strategy: CoordinationStrategy): Promise<PlanStep[]> {
    return [{ description: task }];
  }
}
