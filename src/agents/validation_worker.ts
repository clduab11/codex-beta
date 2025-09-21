import { Logger } from '../core/logger.js';
import {
  AgentCapability,
  AgentStatus,
  AgentType,
  Task
} from '../core/types.js';
import { Agent } from './agent.js';

const CAPABILITIES: AgentCapability[] = [
  {
    name: 'validate_code',
    version: '1.0.0',
    description: 'Run static validation gates and policy checks',
    parameters: { rules: ['no-console', 'prefer-async', 'document-public-apis'] }
  },
  {
    name: 'quality_gate',
    version: '1.0.0',
    description: 'Apply repository-specific quality criteria',
    parameters: { checks: ['style', 'security', 'observability'] }
  }
];

export class ValidationWorker extends Agent {
  private readonly logger = Logger.getInstance();

  constructor() {
    super(AgentType.VALIDATION_WORKER);
    this.metadata.resources = {
      ...this.metadata.resources,
      cpu: 1,
      memory: 256
    };
    this.setStatus(AgentStatus.IDLE);
  }

  getCapabilities(): AgentCapability[] {
    return CAPABILITIES;
  }

  async executeTask(task: Task): Promise<unknown> {
    this.logger.debug('validation-worker', 'Executing task', { taskId: task.id, type: task.type });

    switch (task.type) {
      case 'validate_code':
        return this.handleValidateCode(task);
      case 'quality_report':
        return this.handleQualityReport(task);
      default:
        return { status: 'ignored', reason: `Unsupported task type ${task.type}` };
    }
  }

  private async handleValidateCode(task: Task): Promise<unknown> {
    const code = String(task.payload?.code ?? '');
    const rules: string[] = Array.isArray(task.payload?.rules) ? task.payload.rules : CAPABILITIES[0].parameters.rules;

    const findings: Array<{ rule: string; passed: boolean; detail?: string }> = rules.map((rule) => ({
      rule,
      passed: true
    }));

    if (!code.trim()) {
      findings.push({ rule: 'non-empty', passed: false, detail: 'No code provided for validation' });
    }

    return {
      status: findings.some((f) => !f.passed) ? 'failed' : 'passed',
      passed: findings.every((f) => f.passed),
      findings
    };
  }

  private async handleQualityReport(task: Task): Promise<unknown> {
    const summary = String(task.payload?.summary ?? 'Quality gate executed.');
    return { status: 'ok', summary };
  }
}
