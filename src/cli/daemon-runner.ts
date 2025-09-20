import { CodexSynapticSystem } from '../core/system';
import { Logger } from '../core/logger';

interface ReadyMessage {
  type: 'ready';
  pid: number;
}

interface ErrorMessage {
  type: 'error';
  error: string;
}

type DaemonMessage = ReadyMessage | ErrorMessage;

const logger = Logger.getInstance('daemon');

async function main() {
  const system = new CodexSynapticSystem();

  const notify = (message: DaemonMessage) => {
    if (typeof process.send === 'function') {
      process.send(message);
    }
  };

  try {
    await system.initialize();
    notify({ type: 'ready', pid: process.pid });
    logger.info('daemon', 'Background Codex-Synaptic system initialized');
  } catch (error) {
    const err = error as Error;
    logger.error('daemon', 'Failed to initialize background system', undefined, err);
    notify({ type: 'error', error: err.message });
    process.exit(1);
    return;
  }

  const shutdown = async (reason: string) => {
    try {
      logger.info('daemon', 'Shutting down background system', { reason });
      await system.shutdown();
      logger.info('daemon', 'Background system shutdown complete');
    } catch (error) {
      logger.error('daemon', 'Error during background shutdown', { reason }, error as Error);
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => {
    void shutdown('sigterm');
  });

  process.on('SIGINT', () => {
    void shutdown('sigint');
  });

  process.on('message', (message: any) => {
    if (message && message.type === 'shutdown') {
      void shutdown('message');
    }
  });
}

void main();
