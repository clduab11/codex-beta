/**
 * Minimal storage system for Codex-Synaptic
 */
import { Logger } from './logger.js';

export class MemoryStorage {
  private logger = Logger.getInstance();
  private data: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    this.logger.info('storage', 'Memory storage initialized');
  }

  async shutdown(): Promise<void> {
    this.data.clear();
  }

  async set(key: string, value: any): Promise<void> {
    this.data.set(key, value);
  }

  async get(key: string): Promise<any> {
    return this.data.get(key);
  }

  getMetrics() {
    return { totalRecords: this.data.size };
  }
}

export class StorageManager {
  private storage: MemoryStorage;

  constructor() {
    this.storage = new MemoryStorage();
  }

  async initialize(): Promise<void> {
    await this.storage.initialize();
  }

  async shutdown(): Promise<void> {
    await this.storage.shutdown();
  }

  getStorage(): MemoryStorage {
    return this.storage;
  }
}
