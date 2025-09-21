
import { Agent } from './agent.js';
import { AgentCapability, AgentType, Task } from '../core/types.js';
import { MCPBridge } from '../bridging/mcp-bridge.js';

export class MCPBridgeAgent extends Agent {
  constructor(private bridge: MCPBridge) {
    super(AgentType.MCP_BRIDGE);
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'bridge_message',
        description: 'Bridges a message to another system using MCP',
        version: '1.0.0',
        parameters: {
          target_system: 'string',
          message: 'any'
        }
      }
    ];
  }

  async executeTask(task: Task): Promise<any> {
    const { payload } = task;
    const endpoint: string = payload.target_system || payload.endpoint || 'unknown';
    const message = payload.message ?? {};

    const response = await this.bridge.sendMessage(endpoint, message);
    return {
      type: task.type,
      endpoint,
      response
    };
  }
}
