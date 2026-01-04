import sys
import os
import json
import argparse

# Ensure local imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from engine import VisualDiagnosisEngine
from data_models import KNOWLEDGE_BASE

def main():
    parser = argparse.ArgumentParser(description="Offline Visual Diagnosis Engine")
    parser.add_argument("image_path", help="Path to the image of the condition")
    parser.add_argument("--track", action="store_true", help="Enable progress tracking comparison")
    parser.add_argument("--severity", action="store_true", help="Predict severity level")
    parser.add_argument("--annotate", action="store_true", help="Generate coordinate annotations")
    
    args = parser.parse_args()

    if not os.path.exists(args.image_path):
        print(json.dumps({"error": f"Path not found: {args.image_path}"}))
        return

    engine = VisualDiagnosisEngine()
    result = engine.analyze(args.image_path)
    
    # Enrich with more detailed knowledge base info if needed
    if "label" in result and result["label"] in KNOWLEDGE_BASE:
        kb_info = KNOWLEDGE_BASE[result["label"]]
        result["description"] = kb_info["description"]
        result["advice"] = kb_info["advice"]
        result["next_steps"] = kb_info["next_steps"]

    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
