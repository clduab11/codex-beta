# YAML Input Support in Codex-Synaptic CLI

## Overview

The Codex-Synaptic CLI now supports **YAML-first input parsing** for file-based commands. YAML provides superior readability, better structure, and enhanced human-computer interaction compared to JSON.

## Benefits of YAML Over JSON

1. **Readability**: Comments, multi-line strings, and cleaner syntax
2. **Structure**: Better hierarchical representation without excessive brackets
3. **Maintainability**: Easier to edit and understand at a glance
4. **Standards**: Industry-standard for configuration files
5. **Extraction**: Easier conversion to JSON when needed (YAML→JSON is lossless)

## Supported Commands

### Router Rules

Add routing rules from YAML or JSON files:

```bash
# Add rule from YAML file (recommended)
codex-synaptic router rules --add examples/sample-routing-rule.yaml

# Add rule from JSON file (also supported)
codex-synaptic router rules --add config/routing/my-rule.json
```

### Router Evaluation

Include context files in YAML or JSON format:

```bash
# Evaluate with YAML context file
codex-synaptic router evaluate "implement user authentication" \
  --context examples/auth-context.yaml

# Evaluate with JSON context file
codex-synaptic router evaluate "analyze dataset" \
  --context data/context.json
```

## File Format Detection

The CLI automatically detects file format based on extension:
- `.yaml` or `.yml` → Parsed as YAML
- `.json` → Parsed as JSON

## Example: Routing Rule in YAML

```yaml
# Routing rule for ML model training tasks
id: ml-model-trainer
name: ML Model Training Rule
description: Route machine learning model training requests to specialized ML workers
target: code_worker
precedence: 95
confidence: 0.88

conditions:
  keywords:
    - train
    - model
    - machine learning
  patterns:
    - "train.*model"
    - "build.*ml"

metadata:
  enabled: true
  author: copilot
  version: "1.0.0"
```

## Example: Same Rule in JSON

```json
{
  "id": "ml-model-trainer",
  "name": "ML Model Training Rule",
  "description": "Route machine learning model training requests to specialized ML workers",
  "target": "code_worker",
  "precedence": 95,
  "confidence": 0.88,
  "conditions": {
    "keywords": ["train", "model", "machine learning"],
    "patterns": ["train.*model", "build.*ml"]
  },
  "metadata": {
    "enabled": true,
    "author": "copilot",
    "version": "1.0.0"
  }
}
```

## YAML→JSON Conversion

The CLI uses `YamlFeedforwardFilter` to automatically convert YAML to JSON internally when needed. This ensures compatibility with all existing APIs and services while providing a superior authoring experience.

## Best Practices

1. **Use YAML for new files**: Better readability and maintainability
2. **Add comments**: YAML supports comments (starting with `#`)
3. **Use consistent indentation**: 2 spaces (matches project standard)
4. **Validate before use**: Check YAML syntax in your editor
5. **Version control friendly**: YAML diffs are clearer than JSON

## Migration Guide

### Converting JSON to YAML

You can easily convert existing JSON files to YAML:

```bash
# Using js-yaml CLI (if installed globally)
js-yaml config/routing/my-rule.json > config/routing/my-rule.yaml

# Or use online converters like json2yaml.com
```

### Keeping Both Formats

You can maintain both YAML and JSON versions:
- Use YAML for manual editing
- Generate JSON from YAML for tooling compatibility

## Technical Implementation

The YAML input support is implemented through:

1. **File format detection** based on extension
2. **js-yaml library** for robust YAML parsing
3. **YamlFeedforwardFilter** for YAML→JSON conversion when needed
4. **Automatic error handling** with clear error messages

See `src/cli/index.ts` for implementation details.
