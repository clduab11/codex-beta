import { describe, it, expect } from 'vitest';
import { YamlSchemaUtils, YamlFeedforwardFilter } from '../../src/utils/yaml-output.js';

describe('YAML Schema Validation and Enhancement', () => {
  it('should load and validate the master schema', async () => {
    const schema = await YamlSchemaUtils.loadMasterSchema();
    
    expect(schema).toBeDefined();
    expect(schema.version).toBe(1);
    expect(schema.meta.issue_id).toBe('SELF_IMPROVEMENT_INIT');
    expect(schema.summary.objectives_ordered).toHaveLength(10);
  });

  it('should have comprehensive backlog items B1-B12', async () => {
    const schema = await YamlSchemaUtils.loadMasterSchema();
    
    expect(schema.backlog.items).toHaveLength(12);
    
    // Verify each backlog item has required fields
    schema.backlog.items.forEach((item: any) => {
      expect(item.id).toBeDefined();
      expect(item.title).toBeDefined();
      expect(item.rationale).toBeDefined();
      expect(item.effort).toMatch(/^[SML]$/);
      expect(item.risk).toMatch(/^[LMH]$/);
      expect(item.acceptance).toBeInstanceOf(Array);
      expect(item.acceptance.length).toBeGreaterThan(0);
    });

    // Verify specific backlog items
    const b1 = schema.backlog.items.find((item: any) => item.id === 'B1');
    expect(b1.title).toBe('Define module boundary map');
    
    const b12 = schema.backlog.items.find((item: any) => item.id === 'B12');
    expect(b12.title).toBe('Performance monitoring integration');
  });

  it('should have comprehensive security threats (≥5)', async () => {
    const schema = await YamlSchemaUtils.loadMasterSchema();
    
    expect(schema.security.threats).toHaveLength(6);
    
    // Verify each threat has required fields
    schema.security.threats.forEach((threat: any) => {
      expect(threat.id).toBeDefined();
      expect(threat.name).toBeDefined();
      expect(threat.description).toBeDefined();
      expect(threat.severity).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
      expect(threat.mitigation).toBeInstanceOf(Array);
      expect(threat.validation_rules).toBeInstanceOf(Array);
    });

    // Verify specific threats
    const t1 = schema.security.threats.find((threat: any) => threat.id === 'T1');
    expect(t1.name).toBe('Arbitrary task execution');
    expect(t1.severity).toBe('HIGH');
  });

  it('should have comprehensive telemetry events and metrics', async () => {
    const schema = await YamlSchemaUtils.loadMasterSchema();
    
    expect(schema.telemetry.events).toHaveLength(7);
    expect(schema.telemetry.metrics.gauges).toHaveLength(4);
    expect(schema.telemetry.metrics.counters).toHaveLength(4);
    expect(schema.telemetry.metrics.histograms).toHaveLength(4);

    // Verify agent lifecycle event
    const agentEvent = schema.telemetry.events.find((event: any) => event.name === 'agent.lifecycle');
    expect(agentEvent.fields).toContain('agentId');
    expect(agentEvent.fields).toContain('state_from');
    expect(agentEvent.fields).toContain('state_to');
  });

  it('should have complete memory bridge specification', async () => {
    const schema = await YamlSchemaUtils.loadMasterSchema();
    
    expect(schema.memory_bridge_spec.interface.methods).toHaveLength(5);
    
    const putMemory = schema.memory_bridge_spec.interface.methods.find((m: any) => m.name === 'putMemory');
    expect(putMemory).toBeDefined();
    expect(putMemory.input.namespace).toBe('string');
    expect(putMemory.input.text).toBe('string');
    
    const reconcile = schema.memory_bridge_spec.interface.methods.find((m: any) => m.name === 'reconcile');
    expect(reconcile).toBeDefined();
    expect(reconcile.input.strategy).toBe('enum[ts-wins|py-wins|merge]');

    // Verify data types
    expect(schema.memory_bridge_spec.data_types.MemoryHit).toBeDefined();
    expect(schema.memory_bridge_spec.data_types.MemoryEntry).toBeDefined();
  });

  it('should have enhanced swarm algorithms with parameter ranges', async () => {
    const schema = await YamlSchemaUtils.loadMasterSchema();
    
    expect(schema.algorithms.swarm.pso.parameter_ranges).toBeDefined();
    expect(schema.algorithms.swarm.aco.parameter_ranges).toBeDefined();
    expect(schema.algorithms.swarm.flocking.parameter_ranges).toBeDefined();

    // Verify PSO enhancements
    expect(schema.algorithms.swarm.pso.enhancements).toContain('Adaptive inertia schedule with linear or exponential decay');
  });

  it('should have comprehensive consensus algorithms', async () => {
    const schema = await YamlSchemaUtils.loadMasterSchema();
    
    expect(schema.consensus.algorithms).toHaveLength(4);
    
    const algorithms = schema.consensus.algorithms.map((alg: any) => alg.name);
    expect(algorithms).toContain('raft');
    expect(algorithms).toContain('bft');
    expect(algorithms).toContain('pow');
    expect(algorithms).toContain('pos');

    // Verify BFT fault tolerance
    const bft = schema.consensus.algorithms.find((alg: any) => alg.name === 'bft');
    expect(bft.fault_tolerance).toBe('Byzantine failures up to (n-1)/3 nodes');
  });

  it('should have detailed sprint planning', async () => {
    const schema = await YamlSchemaUtils.loadMasterSchema();
    
    expect(schema.sprints).toHaveLength(3);
    
    schema.sprints.forEach((sprint: any) => {
      expect(sprint.duration_weeks).toBeDefined();
      expect(sprint.goals).toBeInstanceOf(Array);
      expect(sprint.exit_criteria).toBeInstanceOf(Array);
      expect(sprint.deliverables).toBeInstanceOf(Array);
    });
  });

  it('should create a populated improvement plan YAML', async () => {
    const planYaml = await YamlSchemaUtils.createImprovementPlan();
    
    expect(planYaml).toBeDefined();
    expect(planYaml).toContain('version: 1');
    expect(planYaml).toContain('SELF_IMPROVEMENT_INIT');
    
    // Verify it's valid YAML
    const validation = YamlFeedforwardFilter.validateYamlStructure(planYaml);
    expect(validation.valid).toBe(true);
  });

  it('should perform lossless YAML→JSON conversion', async () => {
    const schema = await YamlSchemaUtils.loadMasterSchema();
    const yamlContent = YamlSchemaUtils.generateFromSchema(schema);
    
    // Test conversion capabilities
    const yamlCapabilities = { acceptsYAML: true, acceptsJSON: true, contentTypes: ['text/yaml'] };
    const jsonCapabilities = { acceptsYAML: false, acceptsJSON: true, contentTypes: ['application/json'] };
    
    const yamlResult = YamlFeedforwardFilter.apply(yamlContent, yamlCapabilities);
    expect(yamlResult.format).toBe('yaml');
    expect(yamlResult.contentType).toBe('text/yaml');
    
    const jsonResult = YamlFeedforwardFilter.apply(yamlContent, jsonCapabilities);
    expect(jsonResult.format).toBe('json');
    expect(jsonResult.contentType).toBe('application/json');
    
    // Verify lossless conversion by parsing both
    const yamlParsed = require('js-yaml').load(yamlResult.content);
    const jsonParsed = JSON.parse(jsonResult.content);
    
    expect(yamlParsed.version).toBe(jsonParsed.version);
    expect(yamlParsed.backlog.items.length).toBe(jsonParsed.backlog.items.length);
  });

  it('should have comprehensive acceptance criteria', async () => {
    const schema = await YamlSchemaUtils.loadMasterSchema();
    
    expect(schema.acceptance_criteria).toHaveLength(12);
    expect(schema.acceptance_criteria).toContain('Backlog items B1-B12 enumerated with detailed acceptance arrays and effort/risk assessment');
    expect(schema.acceptance_criteria).toContain('Minimum 6 security threats documented with specific mitigations and validation rules');
  });
});