"""
SynapticLoop class implementing the core cognitive cycle for the Codex-Synaptic agent.
Inspired by the BDI (Belief-Desire-Intention) model.
"""

from codex import Codex
from typing import Set, List


class SynapticLoop:
    """
    Implements the main agent cognitive loop that orchestrates perception, 
    belief updating, and intention formation.
    """
    
    def __init__(self, codex_db_path: str = "./codex_db", use_mock_embeddings: bool = False):
        """
        Initialize the SynapticLoop with a Codex instance and belief set.
        
        Args:
            codex_db_path: Path to the Codex database directory
            use_mock_embeddings: If True, use mock embeddings for offline testing
        """
        # Initialize the Codex for long-term memory
        self.codex = Codex(codex_db_path, use_mock_embeddings)
        
        # Initialize beliefs as a set of strings
        self.beliefs: Set[str] = set()
    
    def process_sensory_input(self, text_input: str) -> None:
        """
        Entry point for new information processing.
        
        This method processes new sensory input by storing it in memory,
        updating beliefs, and running the main cognitive cycle.
        
        Args:
            text_input: Raw text input from the environment
        """
        print(f"🧠 Processing sensory input: '{text_input}'")
        
        # Step 1: Store raw input in Codex memory
        memory = self.codex.add_memory(text_input)
        print(f"📝 Memory stored with ID: {memory.id}")
        
        # Step 2: Update beliefs based on the input
        self._update_beliefs(text_input)
        
        # Step 3: Run the main cognitive cycle
        self._run_cycle()
    
    def _update_beliefs(self, text_input: str) -> None:
        """
        Updates the agent's beliefs based on new input.
        
        For this initial implementation, this simply adds a new belief
        about the recent user input.
        
        Args:
            text_input: The text input to process into beliefs
        """
        # Create a new belief about the recent input
        new_belief = f"The user recently said: {text_input}"
        self.beliefs.add(new_belief)
        print(f"💭 Belief updated: {new_belief}")
    
    def _run_cycle(self) -> None:
        """
        The core 'think' step of the cognitive cycle.
        
        This method orchestrates the deliberation process and outputs
        the agent's current state and intentions.
        """
        print("\n🔄 Running cognitive cycle...")
        
        # Step 1: Deliberate to form intentions
        intention = self._deliberate()
        
        # Step 2: Display current beliefs and new intention
        print("📋 Current beliefs:")
        for belief in self.beliefs:
            print(f"  • {belief}")
        
        print(f"\n🎯 New intention: {intention}")
        print("=" * 60)
    
    def _deliberate(self) -> str:
        """
        Performs deliberation to determine the agent's next intention.
        
        For this initial sprint implementation, this returns a static
        intention string. In future sprints, this could incorporate
        more sophisticated reasoning based on beliefs and retrieved memories.
        
        Returns:
            str: The agent's next intention
        """
        # Simple placeholder deliberation for Sprint 2
        return "Formulate a response based on recent input and related memories."