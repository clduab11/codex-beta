#!/usr/bin/env python3
"""
Codex-Synaptic Mock Main Application Entry Point

This module provides the command-line interface for the Codex-Synaptic agent
using mock implementations that don't require external dependencies.

Usage:
    python main_mock.py

Commands:
    - Type any text to provide input to the agent
    - 'quit' or 'exit' to terminate the application
    - 'clear' to clear the agent's beliefs
    - 'status' to display current cognitive state
    - 'help' to show available commands
"""

import sys
import os

# Add the src directory to the Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.codex_synaptic.synaptic_loop_mock import MockSynapticLoop


def print_welcome():
    """Displays the welcome message and instructions."""
    print("\n" + "="*70)
    print("🧠⚡ CODEX-SYNAPTIC AGENT - SPRINT 2 (MOCK VERSION)")
    print("="*70)
    print("Welcome to the Codex-Synaptic cognitive agent!")
    print("\nThis agent features:")
    print("  • 🧠 The Codex: Long-term vector memory storage (mock implementation)")
    print("  • ⚡ The Synaptic Loop: BDI-inspired cognitive cycle")
    print("  • 🔍 Sensory Input: Text processing and perception")
    print("\nNote: This is a mock version for demonstration without external dependencies.")
    print("\nCommands:")
    print("  • Type any text to interact with the agent")
    print("  • 'quit' or 'exit' - Terminate the application")
    print("  • 'clear' - Clear the agent's beliefs")
    print("  • 'status' - Display current cognitive state")
    print("  • 'help' - Show this help message")
    print("="*70 + "\n")


def print_help():
    """Displays available commands."""
    print("\n📖 AVAILABLE COMMANDS:")
    print("  • Any text input - Processed through the agent's cognitive loop")
    print("  • 'quit' or 'exit' - Safely terminate the application")
    print("  • 'clear' - Clear all current beliefs")
    print("  • 'status' - Display current cognitive state")
    print("  • 'help' - Show this help message")
    print()


def handle_special_command(agent: MockSynapticLoop, command: str) -> bool:
    """
    Handles special system commands.
    
    Args:
        agent: The MockSynapticLoop agent instance
        command: The command to process
        
    Returns:
        bool: True if the command was a special command, False otherwise
    """
    command = command.lower().strip()
    
    if command in ['quit', 'exit']:
        print("\n👋 Thank you for using Codex-Synaptic! Goodbye.")
        return True
    elif command == 'clear':
        agent.clear_beliefs()
        return True
    elif command == 'status':
        agent._display_cognitive_state()
        return True
    elif command == 'help':
        print_help()
        return True
    
    return False


def main():
    """
    Main application function that creates the agent and runs the interactive loop.
    """
    try:
        # Initialize the Codex-Synaptic agent (mock version)
        print("🔧 Initializing Codex-Synaptic agent (mock version)...")
        agent = MockSynapticLoop()
        print("✅ Agent initialized successfully!")
        
        # Display welcome message
        print_welcome()
        
        # Main interaction loop
        while True:
            try:
                # Prompt for user input
                user_input = input("💬 > ").strip()
                
                # Skip empty input
                if not user_input:
                    continue
                
                # Handle special commands
                if handle_special_command(agent, user_input):
                    if user_input.lower() in ['quit', 'exit']:
                        break
                    continue
                
                # Process the input through the agent's cognitive system
                print(f"\n🔄 Processing input through cognitive system...")
                agent.process_sensory_input(user_input)
                
            except KeyboardInterrupt:
                print("\n\n⚠️  Keyboard interrupt received.")
                confirm = input("Are you sure you want to quit? (y/N): ").strip().lower()
                if confirm in ['y', 'yes']:
                    print("👋 Goodbye!")
                    break
                else:
                    print("Continuing...\n")
                    continue
            except EOFError:
                print("\n👋 End of input. Goodbye!")
                break
            except Exception as e:
                print(f"\n❌ Error processing input: {e}")
                print("The agent will continue running. Please try again.")
                continue
                
    except Exception as e:
        print(f"❌ Failed to initialize agent: {e}")
        print("Please check that all dependencies are installed:")
        print("  pip install -r requirements.txt")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
        sys.exit(0)


if __name__ == '__main__':
    main()