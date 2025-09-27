"""
Main application entry point for the Codex-Synaptic agent.
Provides a command-line interface for interacting with the cognitive system.
"""

from .synaptic_loop import SynapticLoop
import os


def main():
    """
    Main function that creates the agent and runs the interactive loop.
    """
    print("🧠⚡ Welcome to Codex-Synaptic Cognitive Architecture")
    print("=" * 60)
    print("This is the foundational cognitive agent implementing:")
    print("• The Codex - Long-term vector memory system with OpenAI embeddings")
    print("• The Synaptic Loop - Core sense-think-act cycle")
    print("• Belief-Desire-Intention (BDI) inspired architecture")
    print("=" * 60)
    print("Type 'quit' or 'exit' to terminate the session.\n")
    
    # Get OpenAI API key from environment or use mock embeddings
    openai_api_key = os.getenv('OPENAI_API_KEY')
    use_mock_embeddings = openai_api_key is None
    
    if use_mock_embeddings:
        print("⚠️  No OPENAI_API_KEY found in environment. Using mock embeddings.")
        print("   Set OPENAI_API_KEY environment variable to use real OpenAI embeddings.\n")
    
    try:
        # Initialize the SynapticLoop agent
        agent = SynapticLoop(use_mock_embeddings=use_mock_embeddings, openai_api_key=openai_api_key)
    except Exception as e:
        print(f"❌ Failed to initialize agent: {e}")
        print("Please check your configuration and try again.")
        return
    
    # Main interaction loop
    while True:
        try:
            # Prompt user for input
            user_input = input("> ").strip()
            
            # Check for exit commands
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\n👋 Goodbye! Shutting down Codex-Synaptic agent...")
                break
            
            # Skip empty inputs
            if not user_input:
                continue
            
            # Process the input through the agent's cognitive system
            agent.process_sensory_input(user_input)
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye! Shutting down Codex-Synaptic agent...")
            break
        except Exception as e:
            print(f"❌ Error occurred: {e}")
            print("Please try again or type 'quit' to exit.")


if __name__ == '__main__':
    main()