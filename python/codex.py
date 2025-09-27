"""
Codex class for long-term memory management using ChromaDB vector database with OpenAI embeddings.
"""

import chromadb
from .memory_model import Memory
import time
import uuid
from typing import List
import os
import hashlib
import numpy as np

# Try to import OpenAI, fall back to mock if offline or not available
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class MockEmbeddingModel:
    """Mock embedding model for offline testing."""
    
    def encode(self, text):
        """Create a simple hash-based embedding for testing."""
        hash_obj = hashlib.md5(text.encode())
        hash_bytes = hash_obj.digest()
        # Convert to normalized float vector
        embedding = [float(b) / 255.0 for b in hash_bytes]
        # Pad to 1536 dimensions for consistency with OpenAI text-embedding-3-small
        while len(embedding) < 1536:
            embedding.extend(embedding[:min(1536 - len(embedding), len(embedding))])
        return np.array(embedding[:1536])


class OpenAIEmbeddingModel:
    """OpenAI embedding model wrapper."""
    
    def __init__(self, api_key: str = None, model: str = "text-embedding-3-small"):
        """
        Initialize OpenAI embedding model.
        
        Args:
            api_key: OpenAI API key. If None, will try to read from environment
            model: OpenAI embedding model to use
        """
        self.client = OpenAI(api_key=api_key)
        self.model = model
    
    def encode(self, text):
        """Generate embeddings using OpenAI API."""
        try:
            response = self.client.embeddings.create(
                input=text,
                model=self.model
            )
            return np.array(response.data[0].embedding)
        except Exception as e:
            print(f"⚠️  Failed to generate OpenAI embedding: {e}")
            # Fall back to mock if API fails
            mock_model = MockEmbeddingModel()
            return mock_model.encode(text)


class Codex:
    """Manages the agent's long-term memory using a vector database."""
    
    def __init__(self, db_path: str = "./codex_db", use_mock_embeddings: bool = False, openai_api_key: str = None):
        """
        Initialize the Codex with a persistent ChromaDB client.
        
        Args:
            db_path: Path to the ChromaDB database directory
            use_mock_embeddings: If True, use mock embeddings instead of OpenAI
            openai_api_key: OpenAI API key for embeddings
        """
        # Ensure database directory exists
        os.makedirs(db_path, exist_ok=True)
        
        # Initialize persistent ChromaDB client
        self.client = chromadb.PersistentClient(path=db_path)
        
        # Get or create collection for memories
        self.collection = self.client.get_or_create_collection(
            name="codex_memories",
            metadata={"hnsw:space": "cosine"}  # Use cosine similarity
        )
        
        # Initialize embedding model with OpenAI or fallback
        if use_mock_embeddings or not OPENAI_AVAILABLE:
            print("⚠️  Using mock embeddings (offline mode)")
            self.embedding_model = MockEmbeddingModel()
        else:
            try:
                print("🔄 Loading OpenAI embedding model...")
                self.embedding_model = OpenAIEmbeddingModel(api_key=openai_api_key)
                print("✅ OpenAI embedding model loaded successfully")
            except Exception as e:
                print(f"⚠️  Failed to load OpenAI embedding model, falling back to mock: {e}")
                self.embedding_model = MockEmbeddingModel()
    
    def add_memory(self, content: str) -> Memory:
        """
        Adds a new memory to the Codex.
        
        This method generates an embedding for the content using OpenAI embeddings,
        creates a Memory object, and stores it in the ChromaDB collection.
        
        Args:
            content: The text content to store as a memory
            
        Returns:
            Memory: The created Memory object
        """
        # Step 1: Generate embedding for the content using OpenAI
        embedding = self.embedding_model.encode(content).tolist()
        
        # Step 2: Create a Memory object
        memory = Memory(
            content=content,
            embedding=embedding,
            metadata={"added_by": "synaptic_loop"},
            timestamp=time.time()
        )
        
        # Step 3: Add to ChromaDB collection
        self.collection.add(
            ids=[memory.id],
            embeddings=[memory.embedding],
            documents=[memory.content],
            metadatas=[{
                "timestamp": memory.timestamp,
                **memory.metadata
            }]
        )
        
        return memory
    
    def retrieve_memory(self, query: str, top_k: int = 5) -> List[str]:
        """
        Retrieves the most relevant memories based on a query.
        
        This method generates an embedding for the query using OpenAI embeddings,
        performs a similarity search against the ChromaDB collection, and returns
        the content of the most similar memories.
        
        Args:
            query: The search query string
            top_k: Number of top similar memories to retrieve
            
        Returns:
            List[str]: List of content strings from the most similar memories
        """
        # Step 1: Generate embedding for the query using OpenAI
        query_embedding = self.embedding_model.encode(query).tolist()
        
        # Step 2: Perform similarity search in ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        # Step 3: Extract and return content strings
        if results['documents'] and len(results['documents']) > 0:
            return results['documents'][0]  # First (and only) query result
        else:
            return []