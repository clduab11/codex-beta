import sqlite3 from 'sqlite3';

export class CodexMemorySystem {
  private db: any;

  constructor() {
    this.db = new sqlite3.Database('.codex-synaptic/memory.db');
    this.initializeTables();
  }

  private initializeTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_interactions (
        id INTEGER PRIMARY KEY,
        agent_id TEXT,
        interaction_type TEXT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS training_data (
        id INTEGER PRIMARY KEY,
        pattern TEXT,
        data TEXT,
        performance_metrics TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS memory_entries (
        id INTEGER PRIMARY KEY,
        namespace TEXT,
        key TEXT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async store(namespace: string, key: string, data: any) {
    await new Promise<void>((resolve, reject) => {
      const stmt = this.db.prepare(
        'INSERT INTO memory_entries (namespace, key, data) VALUES (?, ?, ?)'
      );
      stmt.run(namespace, key, JSON.stringify(data), (err: Error | null) =>
        err ? reject(err) : resolve()
      );
      stmt.finalize();
    });
  }
}
