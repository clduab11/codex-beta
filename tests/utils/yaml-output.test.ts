import { describe, it, expect, beforeEach } from 'vitest';
import { YamlFeedforwardFilter, YamlSchemaUtils, HiveMindYamlFormatter } from '../../src/utils/yaml-output.js';

describe('YamlFeedforwardFilter', () => {
  const sampleYaml = `
version: 1
meta:
  issue_id: "TEST_ISSUE"
  spec_version: "1.0.0"
  generated_at: "2024-01-01T00:00:00Z"
summary:
  problem: "Test problem description"
  status: "active"
`;

  describe('feedforward conversion', () => {
    it('should return YAML when endpoint accepts YAML', () => {
      const capabilities = {
        acceptsYAML: true,
        acceptsJSON: true,
        contentTypes: ['text/yaml', 'application/json']
      };

      const result = YamlFeedforwardFilter.apply(sampleYaml, capabilities);
      
      expect(result.format).toBe('yaml');
      expect(result.contentType).toBe('text/yaml');
      expect(result.content).toBe(sampleYaml);
    });

    it('should convert to JSON when endpoint only accepts JSON', () => {
      const capabilities = {
        acceptsYAML: false,
        acceptsJSON: true,
        contentTypes: ['application/json']
      };

      const result = YamlFeedforwardFilter.apply(sampleYaml, capabilities);
      
      expect(result.format).toBe('json');
      expect(result.contentType).toBe('application/json');
      
      // Should be valid JSON
      const parsed = JSON.parse(result.content);
      expect(parsed.version).toBe(1);
      expect(parsed.meta.issue_id).toBe('TEST_ISSUE');
    });

    it('should throw error for unsupported endpoints', () => {
      const capabilities = {
        acceptsYAML: false,
        acceptsJSON: false,
        contentTypes: ['text/plain']
      };

      expect(() => {
        YamlFeedforwardFilter.apply(sampleYaml, capabilities);
      }).toThrow('UNSUPPORTED_ENDPOINT');
    });

    it('should throw error for invalid YAML', () => {
      const invalidYaml = `
invalid: yaml: content:
  - unbalanced
    brackets: ]
`;
      
      const capabilities = {
        acceptsYAML: false,
        acceptsJSON: true,
        contentTypes: ['application/json']
      };

      expect(() => {
        YamlFeedforwardFilter.apply(invalidYaml, capabilities);
      }).toThrow('YAML_PARSE_ERROR');
    });
  });

  describe('capability detection', () => {
    it('should detect YAML support from accept header', () => {
      const capabilities = YamlFeedforwardFilter.detectCapabilities(
        'text/yaml, application/json',
        [],
        {}
      );

      expect(capabilities.acceptsYAML).toBe(true);
      expect(capabilities.acceptsJSON).toBe(true);
    });

    it('should detect JSON-only support', () => {
      const capabilities = YamlFeedforwardFilter.detectCapabilities(
        'application/json',
        [],
        {}
      );

      expect(capabilities.acceptsYAML).toBe(false);
      expect(capabilities.acceptsJSON).toBe(true);
    });

    it('should handle empty headers', () => {
      const capabilities = YamlFeedforwardFilter.detectCapabilities();

      expect(capabilities.acceptsYAML).toBe(false);
      expect(capabilities.acceptsJSON).toBe(false);
      expect(capabilities.contentTypes).toEqual([]);
    });
  });

  describe('YAML validation', () => {
    it('should validate correct YAML structure', () => {
      const result = YamlFeedforwardFilter.validateYamlStructure(sampleYaml);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const incompleteYaml = `
version: 1
summary:
  problem: "Missing meta field"
`;
      
      const result = YamlFeedforwardFilter.validateYamlStructure(incompleteYaml);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'meta')).toBe(true);
    });

    it('should detect reserved YAML tokens', () => {
      const ambiguousYaml = `
version: 1
meta:
  issue_id: "TEST"
  spec_version: "1.0.0"
  generated_at: "2024-01-01T00:00:00Z"
summary:
  problem: "Test"
  active: yes
  enabled: on
`;
      
      const result = YamlFeedforwardFilter.validateYamlStructure(ambiguousYaml);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('should be quoted'))).toBe(true);
    });

    it('should handle invalid YAML syntax', () => {
      const invalidYaml = 'invalid: yaml: syntax: [unbalanced';
      
      const result = YamlFeedforwardFilter.validateYamlStructure(invalidYaml);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'parse')).toBe(true);
    });
  });
});

describe('YamlSchemaUtils', () => {
  describe('YAML generation', () => {
    it('should generate properly formatted YAML', () => {
      const data = {
        version: 1,
        meta: {
          timestamp: '2024-01-01T00:00:00Z'
        },
        items: ['item1', 'item2']
      };

      const yaml = YamlSchemaUtils.generateFromSchema(data);
      
      expect(yaml).toContain('version: 1');
      expect(yaml).toContain('items:');
      expect(yaml).toContain('- item1');
      expect(yaml).toContain('- item2');
    });

    it('should sort keys for consistency', () => {
      const data = {
        zebra: 'last',
        alpha: 'first',
        beta: 'middle'
      };

      const yaml = YamlSchemaUtils.generateFromSchema(data);
      
      // Alpha should come before beta, beta before zebra
      const alphaIndex = yaml.indexOf('alpha:');
      const betaIndex = yaml.indexOf('beta:');
      const zebraIndex = yaml.indexOf('zebra:');
      
      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(zebraIndex);
    });
  });
});

describe('HiveMindYamlFormatter', () => {
  describe('execution result formatting', () => {
    it('should format execution results as valid YAML', () => {
      const mockResult = {
        executionId: 'exec-123',
        status: 'completed',
        duration: 5000,
        originalPrompt: 'Generate code for hello world',
        summary: 'Successfully generated hello world function',
        agentCount: 3,
        taskCount: 5,
        meshStatus: { nodeCount: 3 },
        consensusStatus: { totalVotes: 7 }
      };

      const yaml = HiveMindYamlFormatter.formatExecutionResult(mockResult);
      
      expect(yaml).toContain('version: 1');
      expect(yaml).toContain('execution_id: exec-123');
      expect(yaml).toContain('status: completed');
      expect(yaml).toContain('duration_ms: 5000');
      expect(yaml).toContain('agents_deployed: 3');
    });

    it('should handle missing fields gracefully', () => {
      const minimalResult = {
        status: 'completed'
      };

      const yaml = HiveMindYamlFormatter.formatExecutionResult(minimalResult);
      
      expect(yaml).toContain('version: 1');
      expect(yaml).toContain('status: completed');
      expect(yaml).toContain('execution_id: unknown');
      expect(yaml).toContain('duration_ms: 0');
    });
  });

  describe('system status formatting', () => {
    it('should format system status as valid YAML', () => {
      const mockStatus = {
        ready: true,
        uptime: 10000,
        agents: {
          total: 5,
          active: 3,
          byType: { code_worker: 2, validation_worker: 1 }
        },
        mesh: {
          status: 'running',
          nodeCount: 5,
          connectionCount: 10
        }
      };

      const yaml = HiveMindYamlFormatter.formatSystemStatus(mockStatus);
      
      expect(yaml).toContain('version: 1');
      expect(yaml).toContain('status: ready');
      expect(yaml).toContain('uptime_ms: 10000');
      expect(yaml).toContain('total: 5');
      expect(yaml).toContain('nodes: 5');
    });
  });
});