export type Hook = {
  execute: (context: any, result?: any) => Promise<any>;
};

export class CodexHookManager {
  private preHooks: Map<string, Hook[]> = new Map();
  private postHooks: Map<string, Hook[]> = new Map();

  registerPreHook(event: string, hook: Hook) {
    if (!this.preHooks.has(event)) {
      this.preHooks.set(event, []);
    }
    this.preHooks.get(event)!.push(hook);
  }

  registerPostHook(event: string, hook: Hook) {
    if (!this.postHooks.has(event)) {
      this.postHooks.set(event, []);
    }
    this.postHooks.get(event)!.push(hook);
  }

  async executePreHooks(event: string, context: any) {
    const hooks = this.preHooks.get(event) || [];
    for (const hook of hooks) {
      context = await hook.execute(context);
    }
    return context;
  }

  async executePostHooks(event: string, context: any, result: any) {
    const hooks = this.postHooks.get(event) || [];
    for (const hook of hooks) {
      result = await hook.execute(context, result);
    }
    return result;
  }
}
