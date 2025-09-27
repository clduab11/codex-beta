"""
Mock Codex Implementation for Testing

This module provides a mock implementation of the Codex that doesn't require
internet access or external models. It uses simple TF-IDF-like embeddings
for demonstration purposes.
"""

import os
import time
import uuid
import math
from typing import List, Optional, Dict
import chromadb
from chromadb.config import Settings
from .memory_model import Memory


class MockEmbeddingModel:
    """Mock embedding model that generates simple embeddings without external dependencies."""
    
    def __init__(self):
        self.vocab: Dict[str, int] = {}
        self.embedding_dim = 384  # Same as all-MiniLM-L6-v2
    
    def encode(self, text: str) -> List[float]:
        """Generate a simple TF-IDF-like embedding for the text."""
        # Tokenize and normalize
        words = text.lower().split()
        
        # Build vocabulary
        for word in words:
            if word not in self.vocab:
                self.vocab[word] = len(self.vocab)
        
        # Create embedding vector
        embedding = [0.0] * self.embedding_dim
        
        # Simple TF-IDF-like approach
        word_counts = {}
        for word in words:
            word_counts[word] = word_counts.get(word, 0) + 1
        
        # Fill embedding with normalized word frequencies
        for word, count in word_counts.items():
            if word in self.vocab:
                # Use word hash to determine position in embedding
                pos = hash(word) % self.embedding_dim
                # Normalize by document length
                embedding[pos] = count / len(words)
        
        # Add some randomness based on content to make it more realistic
        content_hash = hash(text) % 1000
        for i in range(0, min(50, self.embedding_dim)):  # First 50 dimensions
            embedding[i] += (content_hash / 10000.0) * math.sin(i * 0.1)
        
        # Normalize the vector
        magnitude = math.sqrt(sum(x * x for x in embedding))
        if magnitude > 0:
            embedding = [x / magnitude for x in embedding]
        
        return embedding


class MockCodex:
    """
    Mock implementation of the Codex for testing purposes.
    
    This version uses a simple mock embedding model that doesn't require
    internet access or external dependencies.
    """
    
    def __init__(self, db_path: str = "./codex_db"):
        """
        Initialize the Mock Codex with a persistent ChromaDB instance.
        
        Args:
            db_path: Directory path for the ChromaDB persistent storage
        """
        # Ensure the database directory exists
        os.makedirs(db_path, exist_ok=True)
        
        # Initialize ChromaDB with persistent storage
        self.client = chromadb.PersistentClient(
            path=db_path,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Get or create the codex_memories collection
        self.collection = self.client.get_or_create_collection(
            name="codex_memories",
            metadata={"description": "Agent long-term memory storage (mock)"}
        )
        
        # Initialize the mock embedding model
        self.embedding_model = MockEmbeddingModel()
            
    def add_memory(self, content: str, metadata: Optional[dict] = None) -> Memory:
        """
        Adds a new memory to the Mock Codex.
        
        Args:
            content: The textual content to store as a memory
            metadata: Optional additional metadata to associate with the memory
            
        Returns:
            Memory: The created Memory object with generated ID and embedding
        """
        if not content.strip():
            raise ValueError("Memory content cannot be empty")
            
        # Generate embedding for the content using mock model
        embedding = self.embedding_model.encode(content)
        
        # Create the memory object
        memory = Memory(
            content=content,
            embedding=embedding,
            metadata=metadata or {},
            timestamp=time.time()
        )
        
        # Store in ChromaDB
        try:
            self.collection.add(
                ids=[memory.id],
                embeddings=[memory.embedding],
                documents=[memory.content],
                metadatas=[{
                    "timestamp": memory.timestamp,
                    **memory.metadata
                }]
            )
        except Exception as e:
            raise Exception(f"Failed to store memory in database: {e}")
            
        return memory
    
    def retrieve_memory(self, query: str, top_k: int = 5) -> List[str]:
        """
        Retrieves the most relevant memories based on a query.
        
        Args:
            query: The search query to find relevant memories
            top_k: Maximum number of memories to return (default: 5)
            
        Returns:
            List[str]: List of memory content strings, ordered by relevance
        """
        if not query.strip():
            raise ValueError("Query cannot be empty")
            
        if top_k <= 0:
            raise ValueError("top_k must be a positive integer")
        
        # Generate embedding for the query using mock model
        query_embedding = self.embedding_model.encode(query)
        
        # Perform similarity search
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=min(top_k, self.collection.count())
            )
            
            # Extract content from results
            if results['documents'] and len(results['documents']) > 0:
                return results['documents'][0]  # First (and only) query result
            else:
                return []
                
        except Exception as e:
            raise Exception(f"Failed to retrieve memories: {e}")
    
    def get_memory_count(self) -> int:
        """
        Returns the total number of memories stored in the Mock Codex.
        
        Returns:
            int: Total count of stored memories
        """
        return self.collection.count()
    
    def clear_memories(self) -> None:
        """
        Removes all memories from the Mock Codex.
        """
        # Delete the collection and recreate it
        self.client.delete_collection("codex_memories")
        self.collection = self.client.get_or_create_collection(
            name="codex_memories",
            metadata={"description": "Agent long-term memory storage (mock)"}
        )