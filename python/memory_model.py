"""
Memory model definition using Pydantic for the Codex-Synaptic cognitive architecture.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any
import uuid
import time


class Memory(BaseModel):
    """
    Represents a memory object stored in the Codex vector database.
    
    Attributes:
        id: Unique UUID string identifier for the memory
        content: The raw text content of the memory
        embedding: Vector embedding representation as list of floats
        metadata: Additional metadata dictionary for the memory
        timestamp: Unix timestamp of when the memory was created
    """
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    embedding: List[float]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: float = Field(default_factory=time.time)