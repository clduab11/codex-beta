export interface MCPTool {
  name: string;
  description: string;
  execute(params: any): Promise<any>;
}
