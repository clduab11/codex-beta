# Memory Bridge Specification v1.0

## Overview

The Memory Bridge provides seamless integration between TypeScript-based local storage (SQLite) and Python-based vector storage (ChromaDB), enabling unified memory management across the codex-synaptic ecosystem.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TypeScript    │    │  Memory Bridge  │    │     Python      │
│     SQLite      │◄──►│   Interface     │◄──►│    ChromaDB     │
│   (Local Store) │    │                 │    │ (Vector Store)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Interface Contract

### Core Methods

#### `putMemory(namespace, text, id?, metadata?)`

Stores or updates a textual memory with optional asynchronous embedding generation.

**Input Schema:**
```yaml
namespace: string        # Memory namespace for organization
text: string            # Textual content to store
id: optional|string     # Optional explicit ID (auto-generated if omitted)
metadata: optional|object # Additional metadata to associate
```

**Output Schema:**
```yaml
id: string              # Unique identifier for the stored memory
vectorized: boolean     # Whether embedding was generated successfully
```

**Error Types:**
- `RETRYABLE`: Transient failures (network, temporary storage unavailable)
- `NON_RETRYABLE`: Permanent failures (invalid namespace, schema mismatch)

**Implementation Notes:**
- Synchronous storage in SQLite
- Asynchronous embedding generation in ChromaDB
- Automatic retry logic for retryable errors
- Idempotent operations (safe to retry)

#### `semanticQuery(namespace, query, k?)`

Performs semantic search across stored memories using vector similarity.

**Input Schema:**
```yaml
namespace: string       # Target namespace for search
query: string          # Search query text
k: optional|number     # Maximum results to return (default: 10)
```

**Output Schema:**
```yaml
results: array<MemoryHit>
```

**MemoryHit Schema:**
```yaml
id: string             # Memory identifier
content: string        # Original text content
score: number          # Similarity score (0.0-1.0)
metadata: object       # Associated metadata
timestamp: number      # Storage timestamp (Unix epoch)
```

#### `reconcile(strategy)`

Resolves divergence between TypeScript and Python storage systems.

**Input Schema:**
```yaml
strategy: enum         # Reconciliation strategy
  - ts-wins           # TypeScript data takes precedence
  - py-wins           # Python data takes precedence  
  - merge             # Intelligent merge based on timestamps
```

**Output Schema:**
```yaml
actions: array<Action>
```

**Action Schema:**
```yaml
id: string             # Memory identifier
action: enum           # Required action
  - add               # Add missing memory
  - update            # Update existing memory
  - delete            # Remove obsolete memory
  - noop              # No action required
source: enum           # Data source
  - typescript        # From TypeScript store
  - python            # From Python store
```

## Error Handling

### Retryable Errors
- `TRANSIENT_STORE_UNAVAILABLE`: Temporary storage system unavailable
- `NETWORK_TIMEOUT`: Network communication timeout
- `RATE_LIMIT_EXCEEDED`: API rate limiting active

### Non-Retryable Errors
- `INVALID_NAMESPACE`: Namespace format violation
- `SCHEMA_MISMATCH`: Data format incompatibility
- `PERMISSION_DENIED`: Access control violation
- `RESOURCE_EXHAUSTED`: Storage quota exceeded

### Retry Strategy
```yaml
max_retries: 3
backoff_strategy: exponential
initial_delay_ms: 100
max_delay_ms: 5000
jitter: true
```

## Data Flow

### Write Operations
1. **Validate Input**: Schema validation and sanitization
2. **Store Locally**: Immediate storage in SQLite
3. **Generate Embedding**: Asynchronous embedding via Python
4. **Store Vector**: Persistence in ChromaDB
5. **Update Status**: Mark as vectorized in local store

### Read Operations
1. **Query Vector Store**: Semantic search in ChromaDB
2. **Retrieve Metadata**: Fetch additional data from SQLite
3. **Merge Results**: Combine vector and metadata results
4. **Rank and Filter**: Apply scoring and result limits

### Synchronization
1. **Detect Divergence**: Compare timestamps and checksums
2. **Apply Strategy**: Execute reconciliation based on policy
3. **Update Stores**: Propagate changes to both systems
4. **Verify Consistency**: Confirm synchronization success

## Performance Characteristics

### Latency Targets
- **putMemory**: <50ms (local), <500ms (with embedding)
- **semanticQuery**: <100ms for <1K memories, <500ms for <10K memories
- **reconcile**: <1s for <100 divergent items

### Throughput Targets
- **Write Operations**: >100 memories/second
- **Read Operations**: >500 queries/second
- **Batch Operations**: >1000 items/batch

### Resource Usage
- **Memory Overhead**: <10MB base, +1KB per stored memory
- **Storage Growth**: ~2KB per memory (text + metadata + vectors)
- **Network Usage**: Minimal for local operations, embedding-dependent for remote

## Security Considerations

### Access Control
- **Namespace Isolation**: Strict separation between namespaces
- **Permission Validation**: RBAC for memory operations
- **Input Sanitization**: XSS and injection prevention

### Data Protection
- **Encryption at Rest**: Optional encryption for sensitive memories
- **Transport Security**: TLS for inter-service communication
- **Audit Logging**: All operations logged with context

### Privacy
- **Data Retention**: Configurable TTL for memory expiration
- **Anonymization**: Optional PII scrubbing
- **Compliance**: GDPR/CCPA data handling requirements

## Configuration

### Environment Variables
```yaml
MEMORY_BRIDGE_SQLITE_PATH: "/path/to/memory.db"
MEMORY_BRIDGE_CHROMADB_URL: "http://localhost:8000"
MEMORY_BRIDGE_EMBEDDING_MODEL: "sentence-transformers/all-MiniLM-L6-v2"
MEMORY_BRIDGE_MAX_RETRIES: "3"
MEMORY_BRIDGE_TIMEOUT_MS: "5000"
MEMORY_BRIDGE_BATCH_SIZE: "100"
```

### Runtime Configuration
```yaml
bridge:
  sqlite:
    path: "./memory/bridge.db"
    pool_size: 10
    timeout_ms: 5000
  chromadb:
    url: "http://localhost:8000"
    collection_prefix: "codex_"
    batch_size: 100
  embedding:
    model: "sentence-transformers/all-MiniLM-L6-v2"
    cache_size: 1000
    timeout_ms: 10000
  reconciliation:
    check_interval_ms: 300000  # 5 minutes
    max_divergence: 100
    auto_reconcile: true
```

## Testing Strategy

### Unit Tests
- **Method Validation**: Each interface method tested independently
- **Error Handling**: All error conditions covered
- **Edge Cases**: Boundary conditions and malformed inputs

### Integration Tests
- **Round-Trip**: Store and retrieve operations
- **Consistency**: Cross-system data integrity
- **Performance**: Latency and throughput validation

### Load Tests
- **Concurrent Operations**: Multiple simultaneous requests
- **Large Datasets**: Performance with substantial memory stores
- **Failure Recovery**: Behavior under system stress

## Migration Strategy

### Phase 1: Interface Definition
- Define TypeScript interfaces
- Create Python binding stubs
- Implement basic connectivity

### Phase 2: Core Implementation
- SQLite storage backend
- ChromaDB integration
- Basic error handling

### Phase 3: Advanced Features
- Reconciliation algorithms
- Performance optimization
- Security hardening

### Phase 4: Production Readiness
- Monitoring and alerting
- Documentation completion
- Load testing validation

## Monitoring and Observability

### Metrics
- **Operation Latency**: P50, P95, P99 response times
- **Error Rates**: Success/failure ratios by operation
- **Storage Growth**: Memory usage trends
- **Sync Health**: Reconciliation frequency and success rates

### Alerts
- **High Error Rate**: >5% failure rate for any operation
- **Sync Divergence**: >100 items out of sync
- **Performance Degradation**: >2x latency increase
- **Storage Issues**: Disk space or connection problems

### Dashboards
- **Operational Health**: Real-time system status
- **Performance Trends**: Historical latency and throughput
- **Usage Patterns**: Memory creation and query patterns
- **Error Analysis**: Failure breakdown and root causes