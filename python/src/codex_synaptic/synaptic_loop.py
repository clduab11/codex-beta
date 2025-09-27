"""
Synaptic Loop - Core cognitive cycle implementation

This module implements the SynapticLoop class, which represents the agent's
main cognitive processing loop. Inspired by the BDI (Belief-Desire-Intention)
model, it handles perception, belief updating, and intention formation.
"""

from typing import Set, Optional
from .codex import Codex


class SynapticLoop:
    """
    The main agent loop that orchestrates perception, belief updating, and intention formation.
    
    This class implements a BDI-inspired cognitive architecture where the agent:
    1. Perceives sensory input from the environment
    2. Updates its beliefs based on new information
    3. Deliberates to form intentions about future actions
    4. Executes the cognitive cycle continuously
    """
    
    def __init__(self, codex_db_path: str = "./codex_db"):
        """
        Initialize the Synaptic Loop with a Codex instance and belief system.
        
        Args:
            codex_db_path: Path to the Codex database directory
        """
        # Initialize the Codex for long-term memory
        self.codex = Codex(codex_db_path)
        
        # Initialize beliefs as a set of strings representing current agent beliefs
        self.beliefs: Set[str] = set()
        
        # Track the agent's current intention
        self.current_intention: Optional[str] = None
        
    def process_sensory_input(self, text_input: str) -> None:
        """
        Processes new sensory input and triggers the cognitive cycle.
        
        This is the main entry point for new information entering the agent's
        cognitive system. It stores the input, updates beliefs, and runs the
        cognitive cycle.
        
        Args:
            text_input: Raw text input from the environment
        """
        if not text_input.strip():
            print("Warning: Empty input received, skipping processing.")
            return
            
        print(f"🔍 Processing sensory input: '{text_input[:100]}{'...' if len(text_input) > 100 else ''}'")
        
        # Store the raw input in long-term memory
        try:
            memory = self.codex.add_memory(
                content=text_input,
                metadata={
                    "type": "sensory_input",
                    "source": "user_input"
                }
            )
            print(f"💾 Stored memory with ID: {memory.id[:8]}...")
        except Exception as e:
            print(f"❌ Failed to store memory: {e}")
            return
        
        # Update beliefs based on the new input
        self._update_beliefs(text_input)
        
        # Run the main cognitive cycle
        self._run_cycle()
    
    def _update_beliefs(self, new_input: str) -> None:
        """
        Updates the agent's beliefs based on new information.
        
        This method processes new input and updates the agent's belief system.
        For this sprint, it implements a simple belief formation mechanism.
        
        Args:
            new_input: The new information to incorporate into beliefs
        """
        # Create a new belief based on the recent input
        new_belief = f"The user recently said: {new_input}"
        
        # Add the belief to the agent's belief set
        self.beliefs.add(new_belief)
        
        # Retrieve related memories to inform belief updating
        try:
            related_memories = self.codex.retrieve_memory(new_input, top_k=3)
            if related_memories:
                # Form a belief about having related knowledge
                context_belief = f"I have {len(related_memories)} related memories about similar topics"
                self.beliefs.add(context_belief)
        except Exception as e:
            print(f"⚠️  Warning: Could not retrieve related memories: {e}")
    
    def _run_cycle(self) -> None:
        """
        Executes the main cognitive cycle.
        
        This method represents the core 'think' step of the agent, where it
        deliberates based on current beliefs and forms new intentions.
        """
        print("\n🧠 Running cognitive cycle...")
        
        # Deliberate to form new intentions
        new_intention = self._deliberate()
        
        # Update current intention
        self.current_intention = new_intention
        
        # Display current cognitive state
        self._display_cognitive_state()
    
    def _deliberate(self) -> str:
        """
        Performs deliberation to form intentions based on current beliefs.
        
        This method implements the agent's decision-making process, analyzing
        current beliefs to determine what the agent should do next.
        
        Returns:
            str: The agent's new intention
        """
        # For this sprint, implement a simple deliberation mechanism
        # In future sprints, this could be enhanced with more sophisticated reasoning
        
        if not self.beliefs:
            return "Await new sensory input to form beliefs and determine actions."
        
        # Analyze beliefs to form intentions
        belief_count = len(self.beliefs)
        memory_count = self.codex.get_memory_count()
        
        if memory_count > 0:
            intention = f"Formulate a response based on recent input and {memory_count} stored memories."
        else:
            intention = "Formulate a response based on recent input and related memories."
            
        return intention
    
    def _display_cognitive_state(self) -> None:
        """
        Displays the agent's current cognitive state including beliefs and intentions.
        
        This method provides transparency into the agent's internal state for
        debugging and monitoring purposes.
        """
        print("\n" + "="*60)
        print("🧠 AGENT COGNITIVE STATE")
        print("="*60)
        
        # Display current beliefs
        print(f"\n📋 Current Beliefs ({len(self.beliefs)}):")
        if self.beliefs:
            for i, belief in enumerate(sorted(self.beliefs), 1):
                print(f"  {i}. {belief}")
        else:
            print("  No beliefs formed yet.")
        
        # Display current intention
        print(f"\n🎯 Current Intention:")
        if self.current_intention:
            print(f"  {self.current_intention}")
        else:
            print("  No intention formed yet.")
        
        # Display memory statistics
        memory_count = self.codex.get_memory_count()
        print(f"\n💾 Memory Status:")
        print(f"  Total memories stored: {memory_count}")
        
        print("="*60 + "\n")
    
    def get_beliefs(self) -> Set[str]:
        """
        Returns the agent's current beliefs.
        
        Returns:
            Set[str]: Current set of agent beliefs
        """
        return self.beliefs.copy()
    
    def get_current_intention(self) -> Optional[str]:
        """
        Returns the agent's current intention.
        
        Returns:
            Optional[str]: Current intention, or None if no intention is set
        """
        return self.current_intention
    
    def clear_beliefs(self) -> None:
        """
        Clears all current beliefs.
        
        This method can be used to reset the agent's belief state.
        """
        self.beliefs.clear()
        print("🧹 All beliefs cleared.")