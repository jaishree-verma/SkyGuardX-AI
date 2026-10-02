"""
Unified Runner: Demonstrates both Space Intelligence and Earth Impact simultaneously.
"""

import sys
from pathlib import Path

# Add src folder to sys.path
src_dir = str(Path(__file__).parent.resolve())
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from run_space_intelligence import main as run_space
from run_earth_impact import main as run_earth

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("EXECUTING SKYGUARD-X UNIFIED INTELLIGENCE PIPELINE")
    print("=" * 70 + "\n")
    run_space()
    print("\n")
    run_earth()
    print("\n[SUMMARY] All intelligence layers executed successfully.")
