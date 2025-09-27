# Codex-Synaptic Python Implementation - Sprint 2

This directory contains the Python implementation of the Codex-Synaptic cognitive architecture, focusing on the core components developed in Sprint 2.

## Components

### 1. The Codex - Foundational Knowledge Layer (`codex.py`)
- **Purpose**: Long-term memory system using ChromaDB vector database
- **Features**: Persistent storage, semantic retrieval, automatic embedding generation
- **Model**: Uses `sentence-transformers/all-MiniLM-L6-v2` for embeddings

### 2. Memory Model (`memory_model.py`)
- **Purpose**: Pydantic data structure for memory objects
- **Fields**: ID, content, embedding, metadata, timestamp
- **Features**: Auto-generated UUIDs, type validation, serialization

### 3. The Synaptic Loop (`synaptic_loop.py`)
- **Purpose**: Core cognitive cycle inspired by BDI architecture
- **Features**: Belief-Desire-Intention processing, sensory input handling
- **Cycle**: Perception → Belief Update → Deliberation → Action

### 4. Main Application (`main.py`)
- **Purpose**: Command-line interface for agent interaction
- **Features**: Interactive loop, special commands, error handling
- **Commands**: `quit`, `exit`, `clear`, `status`, `help`

## Installation

```bash
cd python
pip install -r requirements.txt
```

## Usage

```bash
cd python
python main.py
```

## Architecture

The implementation follows the BDI (Belief-Desire-Intention) cognitive architecture:

1. **Sensory Input**: Text input is received and processed
2. **Memory Storage**: Input is stored in the Codex vector database
3. **Belief Update**: Agent beliefs are updated based on new information
4. **Deliberation**: Agent forms intentions based on current beliefs
5. **Display**: Current cognitive state is presented to the user

## Dependencies

- `chromadb`: Vector database for persistent memory storage
- `sentence-transformers`: Neural embedding generation
- `pydantic`: Data validation and serialization
- `uuid`: Unique identifier generation

## Future Enhancements

This Sprint 2 implementation provides the foundation for:
- Advanced deliberation algorithms
- Multi-modal sensory input processing
- Integration with the TypeScript ecosystem
- Swarm coordination capabilities
- Consensus-based decision making