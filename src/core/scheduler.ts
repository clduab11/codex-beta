/**
 * Task scheduling and distribution system
 */

import { EventEmitter } from 'events';
import { Logger } from './logger';
import { Task, TaskStatus, AgentId } from './types';
import { AgentRegistry } from '../agents/registry';

// Simple UUID generator for testing
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class TaskScheduler extends EventEmitter {
  private logger = Logger.getInstance();
  private pendingTasks: Map<string, Task> = new Map();
  private runningTasks: Map<string, Task> = new Map();
  private completedTasks: Map<string, Task> = new Map();
  private taskQueue: Task[] = [];
  private schedulerInterval?: NodeJS.Timeout;
  private isRunning = false;

  constructor(private agentRegistry: AgentRegistry) {
    super();
    this.logger.info('scheduler', 'Task scheduler created');
  }

  async initialize(): Promise<void> {
    this.logger.info('scheduler', 'Initializing task scheduler...');
    
    this.isRunning = true;
    this.schedulerInterval = setInterval(() => {
      this.processTasks();
    }, 1000); // Check every second

    this.setupEventHandlers();
    
    this.logger.info('scheduler', 'Task scheduler initialized');
  }

  async shutdown(): Promise<void> {
    this.logger.info('scheduler', 'Shutting down task scheduler...');
    
    this.isRunning = false;
    
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = undefined;
    }

    // Cancel all running tasks
    for (const task of this.runningTasks.values()) {
      task.status = TaskStatus.CANCELLED;
      this.emit('taskCancelled', task);
    }

    this.logger.info('scheduler', 'Task scheduler shutdown complete');
  }

  private setupEventHandlers(): void {
    this.agentRegistry.on('agentStatusChanged', (agentId: AgentId, status: string) => {
      if (status === 'offline' || status === 'error') {
        this.handleAgentFailure(agentId);
      }
    });
  }

  private handleAgentFailure(agentId: AgentId): void {
    this.logger.warn('scheduler', 'Handling agent failure', { agentId: agentId.id });
    
    // Find tasks assigned to the failed agent
    const affectedTasks = Array.from(this.runningTasks.values()).filter(
      task => task.assignedTo?.id === agentId.id
    );

    for (const task of affectedTasks) {
      task.status = TaskStatus.PENDING;
      task.assignedTo = undefined;
      this.runningTasks.delete(task.id);
      this.pendingTasks.set(task.id, task);
      
      this.logger.info('scheduler', 'Task reassigned due to agent failure', { 
        taskId: task.id, 
        failedAgent: agentId.id 
      });
    }
  }

  submitTask(taskData: {
    type: string;
    priority?: number;
    requiredCapabilities: string[];
    payload: Record<string, any>;
    deadline?: Date;
  }): Task {
    const task: Task = {
      id: generateUUID(),
      type: taskData.type,
      priority: taskData.priority || 0,
      requiredCapabilities: taskData.requiredCapabilities,
      payload: taskData.payload,
      created: new Date(),
      deadline: taskData.deadline,
      status: TaskStatus.PENDING
    };

    this.pendingTasks.set(task.id, task);
    this.taskQueue.push(task);
    
    // Sort by priority (higher priority first) and then by creation time
    this.taskQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.created.getTime() - b.created.getTime();
    });

    this.logger.info('scheduler', 'Task submitted', { 
      taskId: task.id, 
      type: task.type, 
      priority: task.priority 
    });
    
    this.emit('taskSubmitted', task);
    return task;
  }

  private processTasks(): void {
    if (!this.isRunning || this.taskQueue.length === 0) {
      return;
    }

    // Process expired tasks
    this.checkExpiredTasks();

    // Try to assign tasks to available agents
    const availableAgents = this.agentRegistry.getAvailableAgents();
    
    let tasksProcessed = 0;
    while (this.taskQueue.length > 0 && tasksProcessed < 10) { // Limit batch size
      const task = this.taskQueue[0];
      
      const suitableAgent = this.findSuitableAgent(task, availableAgents);
      if (suitableAgent) {
        this.assignTaskToAgent(task, suitableAgent);
        this.taskQueue.shift();
        tasksProcessed++;
      } else {
        // No suitable agent available, stop processing for now
        break;
      }
    }
  }

  private findSuitableAgent(task: Task, availableAgents: AgentId[]): AgentId | null {
    for (const agentId of availableAgents) {
      const agentMetadata = this.agentRegistry.getAgent(agentId);
      if (!agentMetadata) continue;

      // Check if agent has required capabilities
      const hasRequiredCapabilities = task.requiredCapabilities.every(reqCap =>
        agentMetadata.capabilities.some(cap => cap.name === reqCap)
      );

      if (hasRequiredCapabilities) {
        return agentId;
      }
    }

    return null;
  }

  private async assignTaskToAgent(task: Task, agentId: AgentId): Promise<void> {
    try {
      task.assignedTo = agentId;
      task.status = TaskStatus.ASSIGNED;
      
      // Move task from pending to running
      this.pendingTasks.delete(task.id);
      this.runningTasks.set(task.id, task);

      // Notify agent (this would be handled by the agent registry/communication layer)
      await this.agentRegistry.assignTask(agentId, task);
      
      task.status = TaskStatus.RUNNING;
      
      this.logger.info('scheduler', 'Task assigned to agent', { 
        taskId: task.id, 
        agentId: agentId.id 
      });
      
      this.emit('taskAssigned', task, agentId);
      
    } catch (error) {
      this.logger.error('scheduler', 'Failed to assign task to agent', { 
        taskId: task.id, 
        agentId: agentId.id 
      }, error as Error);
      
      // Revert task status
      task.status = TaskStatus.PENDING;
      task.assignedTo = undefined;
      this.runningTasks.delete(task.id);
      this.pendingTasks.set(task.id, task);
      this.taskQueue.unshift(task);
    }
  }

  private checkExpiredTasks(): void {
    const now = new Date();
    
    const expiredTasks = Array.from(this.runningTasks.values()).filter(
      task => task.deadline && task.deadline < now
    );

    for (const task of expiredTasks) {
      task.status = TaskStatus.FAILED;
      task.error = 'Task deadline exceeded';
      
      this.runningTasks.delete(task.id);
      this.completedTasks.set(task.id, task);
      
      this.logger.warn('scheduler', 'Task expired', { taskId: task.id });
      this.emit('taskFailed', task);
    }
  }

  completeTask(taskId: string, result: any): void {
    const task = this.runningTasks.get(taskId);
    if (!task) {
      this.logger.warn('scheduler', 'Attempted to complete non-existent task', { taskId });
      return;
    }

    task.status = TaskStatus.COMPLETED;
    task.result = result;
    
    this.runningTasks.delete(taskId);
    this.completedTasks.set(taskId, task);
    
    this.logger.info('scheduler', 'Task completed', { taskId });
    this.emit('taskCompleted', task);
  }

  failTask(taskId: string, error: string): void {
    const task = this.runningTasks.get(taskId);
    if (!task) {
      this.logger.warn('scheduler', 'Attempted to fail non-existent task', { taskId });
      return;
    }

    task.status = TaskStatus.FAILED;
    task.error = error;
    
    this.runningTasks.delete(taskId);
    this.completedTasks.set(taskId, task);
    
    this.logger.warn('scheduler', 'Task failed', { taskId, error });
    this.emit('taskFailed', task);
  }

  getTask(taskId: string): Task | undefined {
    return this.pendingTasks.get(taskId) || 
           this.runningTasks.get(taskId) || 
           this.completedTasks.get(taskId);
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    switch (status) {
      case TaskStatus.PENDING:
        return Array.from(this.pendingTasks.values());
      case TaskStatus.RUNNING:
        return Array.from(this.runningTasks.values());
      case TaskStatus.COMPLETED:
      case TaskStatus.FAILED:
      case TaskStatus.CANCELLED:
        return Array.from(this.completedTasks.values()).filter(t => t.status === status);
      default:
        return [];
    }
  }

  getStatus(): any {
    return {
      isRunning: this.isRunning,
      pendingTasks: this.pendingTasks.size,
      runningTasks: this.runningTasks.size,
      completedTasks: this.completedTasks.size,
      queueSize: this.taskQueue.length
    };
  }

  getTaskQueue(): Task[] {
    return [...this.taskQueue];
  }
}