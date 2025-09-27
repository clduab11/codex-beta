"""
Memory Model - Pydantic data structure for storing agent memories

This module defines the foundational Memory data structure used by the Codex
for long-term knowledge storage and retrieval.
"""

import time
import uuid
from typing import Dict, List, Any
from pydantic import BaseModel, Field


class Memory(BaseModel):
    """
    Represents a single memory stored in the Codex.
    
    Each memory contains content, its vector embedding, metadata for context,
    and a timestamp for temporal organization.
    """
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique identifier for the memory")
    content: str = Field(..., description="The textual content of the memory")
    embedding: List[float] = Field(..., description="Vector embedding of the content")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional contextual information")
    timestamp: float = Field(default_factory=time.time, description="Unix timestamp when memory was created")
    
    class Config:
        """Pydantic configuration for the Memory model."""
        json_encoders = {
            # Ensure timestamps are properly serialized
            float: lambda v: round(v, 3)
        }
        
    def __str__(self) -> str:
        """Human-readable representation of the memory."""
        return f"Memory(id={self.id[:8]}..., content='{self.content[:50]}...', timestamp={self.timestamp})"
    
    def __repr__(self) -> str:
        """Developer representation of the memory."""
        return f"Memory(id='{self.id}', content_length={len(self.content)}, embedding_dim={len(self.embedding)})"