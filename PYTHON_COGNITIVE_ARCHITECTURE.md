# Sprint 2: Python Cognitive Architecture Implementation

This document outlines the implementation of the foundational cognitive architecture for the Codex-Synaptic agent system, completed as part of Sprint 2.

## 🎯 Overview

Sprint 2 successfully implemented a Python-based cognitive architecture featuring:

- **The Codex**: Long-term vector memory system using ChromaDB
- **The Synaptic Loop**: Core sense-think-act cognitive cycle
- **BDI-Inspired Architecture**: Belief-Desire-Intention model implementation
- **Robust Testing**: Comprehensive offline testing capabilities

## 📁 Components

### 1. Memory Model (`memory_model.py`)
- **Purpose**: Pydantic-based data structure for memory objects
- **Features**:
  - UUID-based unique identification
  - Vector embedding storage
  - Metadata support
  - Automatic timestamp generation

### 2. Codex Class (`codex.py`)
- **Purpose**: Vector database management for long-term memory
- **Features**:
  - ChromaDB integration for persistent storage
  - Sentence transformer embeddings (with offline fallback)
  - Semantic similarity search
  - Automatic database initialization

### 3. Synaptic Loop (`synaptic_loop.py`)
- **Purpose**: Main cognitive cycle implementation
- **Features**:
  - Sensory input processing
  - Belief system management
  - Deliberation and intention formation
  - BDI model inspiration

### 4. CLI Interface (`main.py`)
- **Purpose**: Command-line interface for agent interaction
- **Features**:
  - Interactive chat interface
  - Graceful exit handling
  - Real-time cognitive cycle visualization
  - Automatic offline mode detection

## 🚀 Usage

### Basic Usage
```bash
# Install dependencies
pip install -r requirements.txt

# Run the agent
python main.py
```

### Demo Mode (Offline)
```bash
# Run with pre-loaded examples and offline mode
python main_demo.py
```

### Testing
```bash
# Run comprehensive test suite
python test_all_components.py
```

## 🧠 Cognitive Architecture Flow

1. **Sensory Input**: User provides text input
2. **Memory Storage**: Input is stored in the Codex with vector embedding
3. **Belief Update**: Agent's beliefs are updated based on new information
4. **Cognitive Cycle**: Agent runs deliberation process
5. **Intention Formation**: Agent forms intention for next action
6. **Output**: Current beliefs and intentions are displayed

## 🛠️ Technical Implementation Details

### Vector Embeddings
- **Primary**: sentence-transformers/all-MiniLM-L6-v2 model
- **Fallback**: Hash-based mock embeddings for offline testing
- **Dimensions**: 384-dimensional vectors

### Database
- **Engine**: ChromaDB with persistent storage
- **Collection**: "codex_memories" with cosine similarity
- **Location**: `./codex_db/` (configurable)

### Memory Structure
```python
class Memory(BaseModel):
    id: str                    # UUID string
    content: str              # Raw text content
    embedding: List[float]    # Vector representation
    metadata: Dict[str, Any]  # Additional metadata
    timestamp: float          # Unix timestamp
```

## 🔍 Testing Strategy

The implementation includes comprehensive testing:

1. **Unit Tests**: Individual component validation
2. **Integration Tests**: Component interaction verification
3. **Offline Testing**: Mock embedding system for CI/CD
4. **Interactive Testing**: CLI interface validation

### Test Coverage
- ✅ Memory model creation and validation
- ✅ Codex vector storage and retrieval
- ✅ SynapticLoop cognitive cycle processing
- ✅ Full system integration
- ✅ Offline mode functionality

## 📊 Definition of Done Verification

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Memory Pydantic model in dedicated file | ✅ | `memory_model.py` |
| Codex class with ChromaDB integration | ✅ | `codex.py` |
| SynapticLoop class with cognitive methods | ✅ | `synaptic_loop.py` |
| Main.py CLI script | ✅ | `main.py` |
| User input processing and belief display | ✅ | Interactive CLI with belief visualization |
| Complete documentation and type hints | ✅ | Comprehensive docstrings and type annotations |

## 🔧 Configuration Options

### Environment Variables
- `CODEX_DB_PATH`: Database storage path (default: "./codex_db")
- `USE_MOCK_EMBEDDINGS`: Force offline mode (default: auto-detect)

### Initialization Parameters
```python
# Codex configuration
codex = Codex(
    db_path="./custom_db",           # Database path
    use_mock_embeddings=False        # Embedding mode
)

# SynapticLoop configuration
agent = SynapticLoop(
    codex_db_path="./custom_db",     # Database path
    use_mock_embeddings=False        # Embedding mode
)
```

## 🚧 Future Enhancements (Sprint 3+)

- Enhanced deliberation algorithms
- Multi-modal input support
- Advanced memory retrieval strategies
- Integration with the TypeScript orchestration system
- Distributed agent communication
- Learning and adaptation mechanisms

## 🤝 Integration with Existing System

This Python cognitive architecture is designed to work alongside the existing TypeScript-based Codex-Synaptic system:

- **Complementary**: Provides cognitive capabilities while TypeScript handles orchestration
- **Independent**: Can run standalone for focused cognitive tasks
- **Bridgeable**: Designed for future integration via MCP/A2A bridges
- **Compatible**: Follows same design principles and patterns

## 📝 Dependencies

```txt
pydantic>=2.0.0          # Data validation and settings management
chromadb>=0.4.0          # Vector database for embeddings
sentence-transformers>=2.2.0  # Embedding model (with offline fallback)
numpy>=1.24.0            # Numerical computations
```

## 🎉 Conclusion

Sprint 2 successfully delivered a fully functional cognitive architecture that implements the core sense-think-act cycle with persistent memory capabilities. The system is robust, well-tested, and ready for integration with the broader Codex-Synaptic ecosystem.