"""
Main application entry point for the Codex-Synaptic agent.
Provides a command-line interface for interacting with the cognitive system.
"""

from synaptic_loop import SynapticLoop


def main():
    """
    Main function that creates the agent and runs the interactive loop.
    """
    print("🧠⚡ Welcome to Codex-Synaptic Cognitive Architecture")
    print("=" * 60)
    print("This is the foundational cognitive agent implementing:")
    print("• The Codex - Long-term vector memory system")
    print("• The Synaptic Loop - Core sense-think-act cycle")
    print("• Belief-Desire-Intention (BDI) inspired architecture")
    print("=" * 60)
    print("Type 'quit' or 'exit' to terminate the session.\n")
    
    # Initialize the SynapticLoop agent
    # The agent will automatically fall back to mock embeddings if offline
    agent = SynapticLoop()
    
    # Main interaction loop
    while True:
        try:
            # Prompt user for input
            user_input = input("> ").strip()
            
            # Check for exit commands
            if user_input.lower() in ['quit', 'exit']:
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