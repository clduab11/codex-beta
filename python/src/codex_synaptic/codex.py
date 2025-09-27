"""
Codex - Long-term memory system using ChromaDB vector database

This module implements the Codex class, which serves as the agent's long-term
memory system. It uses ChromaDB for persistent vector storage and retrieval,
with sentence transformers for generating embeddings.
"""

import os
import time
import uuid
from typing import List, Optional
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from .memory_model import Memory


class Codex:
    """
    Manages the agent's long-term memory using a vector database.
    
    The Codex provides persistent storage and semantic retrieval of memories
    using vector embeddings. It automatically generates embeddings for new
    content and supports similarity-based retrieval.
    """
    
    def __init__(self, db_path: str = "./codex_db"):
        """
        Initialize the Codex with a persistent ChromaDB instance.
        
        Args:
            db_path: Directory path for the ChromaDB persistent storage
            
        Raises:
            Exception: If the database or embedding model cannot be initialized
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
            metadata={"description": "Agent long-term memory storage"}
        )
        
        # Initialize the sentence transformer model for embeddings
        try:
            self.embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        except Exception as e:
            raise Exception(f"Failed to load embedding model: {e}")
            
    def add_memory(self, content: str, metadata: Optional[dict] = None) -> Memory:
        """
        Adds a new memory to the Codex.
        
        This method generates an embedding for the content, creates a Memory object,
        and stores it in the ChromaDB collection for future retrieval.
        
        Args:
            content: The textual content to store as a memory
            metadata: Optional additional metadata to associate with the memory
            
        Returns:
            Memory: The created Memory object with generated ID and embedding
            
        Raises:
            Exception: If the memory cannot be stored in the database
        """
        if not content.strip():
            raise ValueError("Memory content cannot be empty")
            
        # Generate embedding for the content
        try:
            embedding = self.embedding_model.encode(content).tolist()
        except Exception as e:
            raise Exception(f"Failed to generate embedding: {e}")
        
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
        
        This method generates an embedding for the query, performs a similarity
        search against stored memories, and returns the content of the most
        similar memories.
        
        Args:
            query: The search query to find relevant memories
            top_k: Maximum number of memories to return (default: 5)
            
        Returns:
            List[str]: List of memory content strings, ordered by relevance
            
        Raises:
            Exception: If the query cannot be processed or database access fails
        """
        if not query.strip():
            raise ValueError("Query cannot be empty")
            
        if top_k <= 0:
            raise ValueError("top_k must be a positive integer")
        
        # Generate embedding for the query
        try:
            query_embedding = self.embedding_model.encode(query).tolist()
        except Exception as e:
            raise Exception(f"Failed to generate query embedding: {e}")
        
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
        Returns the total number of memories stored in the Codex.
        
        Returns:
            int: Total count of stored memories
        """
        return self.collection.count()
    
    def clear_memories(self) -> None:
        """
        Removes all memories from the Codex.
        
        Warning: This operation is irreversible and will delete all stored memories.
        """
        # Delete the collection and recreate it
        self.client.delete_collection("codex_memories")
        self.collection = self.client.get_or_create_collection(
            name="codex_memories",
            metadata={"description": "Agent long-term memory storage"}
        )