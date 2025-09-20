/**
 * Configuration management for Codex-Beta system
 */

import { readFile, writeFile, existsSync, mkdirSync } from 'fs';
import { promisify } from 'util';
import { join } from 'path';
import { Logger } from './logger';

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

export interface SystemConfiguration {
  system: {
    logLevel: string;
    maxAgents: number;
    heartbeatInterval: number;
    taskTimeout: number;
  };
  networking: {
    defaultPort: number;
    protocols: string[];
    security: {
      encryption: boolean;
      authRequired: boolean;
    };
  };
  mesh: {
    maxConnections: number;
    updateInterval: number;
    topology: 'ring' | 'mesh' | 'star' | 'tree';
    maxRunDurationMs: number;
  };
  swarm: {
    defaultAlgorithm: 'pso' | 'aco' | 'flocking';
    maxIterations: number;
    convergenceThreshold: number;
    maxRunDurationMs: number;
  };
  consensus: {
    mechanism: 'raft' | 'bft' | 'pow' | 'pos';
    timeout: number;
    minVotes: number;
  };
  bridges: {
    mcp: {
      enabled: boolean;
      endpoints: string[];
    };
    a2a: {
      enabled: boolean;
      discoveryInterval: number;
    };
  };
  gpu?: {
    probeCacheTtlMs: number;
    disableProbeCache: boolean;
  };
}

export class ConfigurationManager {
  private logger = Logger.getInstance();
  private config: SystemConfiguration;
  private configDir = join(process.cwd(), 'config');
  private configFile = join(this.configDir, 'system.json');

  constructor() {
    this.config = this.getDefaultConfiguration();
  }

  private getDefaultConfiguration(): SystemConfiguration {
    return {
      system: {
        logLevel: 'info',
        maxAgents: 100,
        heartbeatInterval: 30000,
        taskTimeout: 300000
      },
      networking: {
        defaultPort: 8080,
        protocols: ['ws', 'tcp', 'grpc'],
        security: {
          encryption: true,
          authRequired: true
        }
      },
      mesh: {
        maxConnections: 10,
        updateInterval: 5000,
        topology: 'mesh',
        maxRunDurationMs: 3600000
      },
      swarm: {
        defaultAlgorithm: 'pso',
        maxIterations: 1000,
        convergenceThreshold: 0.01,
        maxRunDurationMs: 3600000
      },
      consensus: {
        mechanism: 'raft',
        timeout: 10000,
        minVotes: 3
      },
      bridges: {
        mcp: {
          enabled: true,
          endpoints: ['http://localhost:8081']
        },
        a2a: {
          enabled: true,
          discoveryInterval: 60000
        }
      },
      gpu: {
        probeCacheTtlMs: 300000,
        disableProbeCache: false
      }
    };
  }

  async load(): Promise<void> {
    try {
      // Ensure config directory exists
      if (!existsSync(this.configDir)) {
        mkdirSync(this.configDir, { recursive: true });
      }

      if (existsSync(this.configFile)) {
        this.logger.info('config', 'Loading configuration from file', { file: this.configFile });
        const configData = await readFileAsync(this.configFile, 'utf8');
        const loadedConfig = JSON.parse(configData);
        
        // Merge with defaults
        this.config = this.mergeConfiguration(this.config, loadedConfig);
        
        this.logger.info('config', 'Configuration loaded successfully');
      } else {
        this.logger.info('config', 'No configuration file found, using defaults');
        await this.save();
      }
      
      // Validate configuration
      this.validateConfiguration();
      
    } catch (error) {
      this.logger.error('config', 'Failed to load configuration', undefined, error as Error);
      throw error;
    }
  }

  async save(): Promise<void> {
    try {
      const configData = JSON.stringify(this.config, null, 2);
      await writeFileAsync(this.configFile, configData, 'utf8');
      this.logger.info('config', 'Configuration saved successfully', { file: this.configFile });
    } catch (error) {
      this.logger.error('config', 'Failed to save configuration', undefined, error as Error);
      throw error;
    }
  }

  private mergeConfiguration(defaultConfig: any, loadedConfig: any): SystemConfiguration {
    const merged = { ...defaultConfig };
    
    for (const key in loadedConfig) {
      if (typeof loadedConfig[key] === 'object' && !Array.isArray(loadedConfig[key])) {
        merged[key] = this.mergeConfiguration(defaultConfig[key] || {}, loadedConfig[key]);
      } else {
        merged[key] = loadedConfig[key];
      }
    }
    
    return merged;
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    // System validation
    if (this.config.system.maxAgents <= 0) {
      errors.push('system.maxAgents must be greater than 0');
    }
    if (this.config.system.heartbeatInterval < 1000) {
      errors.push('system.heartbeatInterval must be at least 1000ms');
    }

    if (this.config.mesh.maxRunDurationMs < 0) {
      errors.push('mesh.maxRunDurationMs must be >= 0');
    }

    if (this.config.swarm.maxRunDurationMs < 0) {
      errors.push('swarm.maxRunDurationMs must be >= 0');
    }

    // Networking validation
    if (this.config.networking.defaultPort < 1 || this.config.networking.defaultPort > 65535) {
      errors.push('networking.defaultPort must be between 1 and 65535');
    }

    // Consensus validation
    if (this.config.consensus.minVotes < 1) {
      errors.push('consensus.minVotes must be at least 1');
    }

    if (this.config.gpu) {
      if (this.config.gpu.probeCacheTtlMs < 0) {
        errors.push('gpu.probeCacheTtlMs must be >= 0');
      }
    }

    if (errors.length > 0) {
      const error = new Error(`Configuration validation failed: ${errors.join(', ')}`);
      this.logger.error('config', 'Configuration validation failed', { errors });
      throw error;
    }

    this.logger.info('config', 'Configuration validation passed');
  }

  get(): SystemConfiguration {
    return { ...this.config };
  }

  update(updates: Partial<SystemConfiguration>): void {
    this.config = this.mergeConfiguration(this.config, updates);
    this.validateConfiguration();
    this.logger.info('config', 'Configuration updated', { updates });
  }

  getSystemConfig() {
    return this.config.system;
  }

  getNetworkingConfig() {
    return this.config.networking;
  }

  getMeshConfig() {
    return this.config.mesh;
  }

  getSwarmConfig() {
    return this.config.swarm;
  }

  getConsensusConfig() {
    return this.config.consensus;
  }

  getBridgesConfig() {
    return this.config.bridges;
  }
}
