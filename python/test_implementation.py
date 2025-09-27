#!/usr/bin/env python3
"""
Test script for Sprint 2 implementation

This script tests the core functionality of the Codex-Synaptic implementation
to ensure all components work correctly together.
"""

import sys
import os

# Add the src directory to the Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.codex_synaptic.memory_model import Memory
from src.codex_synaptic.codex_mock import MockCodex
from src.codex_synaptic.synaptic_loop_mock import MockSynapticLoop


def test_memory_model():
    """Test the Memory Pydantic model."""
    print("🧪 Testing Memory model...")
    
    # Test basic memory creation
    memory = Memory(
        content="This is a test memory",
        embedding=[0.1, 0.2, 0.3],
        metadata={"test": True}
    )
    
    assert memory.content == "This is a test memory"
    assert memory.embedding == [0.1, 0.2, 0.3]
    assert memory.metadata["test"] is True
    assert isinstance(memory.id, str)
    assert isinstance(memory.timestamp, float)
    
    print("✅ Memory model tests passed!")


def test_codex_functionality():
    """Test the MockCodex class functionality."""
    print("🧪 Testing MockCodex functionality...")
    
    # Create a test MockCodex instance
    codex = MockCodex("./test_codex_db")
    
    # Test adding a memory
    memory = codex.add_memory("This is a test memory for the Codex")
    assert isinstance(memory, Memory)
    assert memory.content == "This is a test memory for the Codex"
    assert len(memory.embedding) > 0  # Should have generated embedding
    
    # Test memory count
    initial_count = codex.get_memory_count()
    assert initial_count >= 1
    
    # Add another memory
    codex.add_memory("Another test memory about artificial intelligence")
    assert codex.get_memory_count() == initial_count + 1
    
    # Test retrieval
    results = codex.retrieve_memory("test memory", top_k=2)
    assert len(results) > 0
    assert isinstance(results[0], str)
    
    print("✅ MockCodex functionality tests passed!")


def test_synaptic_loop():
    """Test the MockSynapticLoop class."""
    print("🧪 Testing MockSynapticLoop functionality...")
    
    # Create a test MockSynapticLoop instance
    loop = MockSynapticLoop("./test_synaptic_db")
    
    # Test initial state
    assert len(loop.get_beliefs()) == 0
    assert loop.get_current_intention() is None
    
    # Test processing sensory input
    loop.process_sensory_input("Hello, I am testing the agent")
    
    # Check that beliefs were updated
    beliefs = loop.get_beliefs()
    assert len(beliefs) > 0
    
    # Check that an intention was formed
    intention = loop.get_current_intention()
    assert intention is not None
    assert isinstance(intention, str)
    
    # Test another input
    loop.process_sensory_input("This is another test input")
    new_beliefs = loop.get_beliefs()
    assert len(new_beliefs) > len(beliefs)
    
    print("✅ MockSynapticLoop functionality tests passed!")


def test_integration():
    """Test the complete integration of all components."""
    print("🧪 Testing complete integration...")
    
    # Create a fresh agent
    agent = MockSynapticLoop("./test_integration_db")
    
    # Simulate a conversation
    inputs = [
        "Hello, my name is Alice",
        "I am working on machine learning projects",
        "Can you help me with neural networks?",
        "I need to understand backpropagation"
    ]
    
    for input_text in inputs:
        agent.process_sensory_input(input_text)
    
    # Check final state
    beliefs = agent.get_beliefs()
    assert len(beliefs) >= len(inputs)  # At least one belief per input
    
    intention = agent.get_current_intention()
    assert intention is not None
    
    # Check that memories were stored
    memory_count = agent.codex.get_memory_count()
    assert memory_count >= len(inputs)
    
    print("✅ Integration tests passed!")


def cleanup_test_databases():
    """Clean up test database directories."""
    import shutil
    test_dirs = ["./test_codex_db", "./test_synaptic_db", "./test_integration_db"]
    
    for dir_path in test_dirs:
        if os.path.exists(dir_path):
            shutil.rmtree(dir_path)
    
    print("🧹 Test databases cleaned up!")


def main():
    """Run all tests."""
    print("="*60)
    print("🧠⚡ CODEX-SYNAPTIC SPRINT 2 IMPLEMENTATION TESTS")
    print("="*60)
    
    try:
        test_memory_model()
        test_codex_functionality()
        test_synaptic_loop()
        test_integration()
        
        print("\n" + "="*60)
        print("🎉 ALL TESTS PASSED! Implementation is working correctly.")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        cleanup_test_databases()
    
    return 0


if __name__ == '__main__':
    sys.exit(main())