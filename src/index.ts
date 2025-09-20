/**
 * Codex-Synaptic: Enhanced OpenAI Codex with distributed agent capabilities
 * Main entry point
 */

import { CodexSynapticSystem } from './core/system';
import { Logger } from './core/logger';

const logger = Logger.getInstance('main');

async function main() {
  logger.info('main', 'Starting Codex-Synaptic system...');
  
  try {
    const system = new CodexSynapticSystem();
    await system.initialize();
    
    logger.info('main', 'Codex-Synaptic system initialized successfully');
    
    // Keep the system running
    process.on('SIGINT', async () => {
      logger.info('main', 'Shutting down Codex-Synaptic system...');
      await system.shutdown();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('main', 'Failed to start Codex-Synaptic system', undefined, error as Error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main };