import sys
import json
import os

# Ensure the core and protocols are discoverable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.engine import MedicalOCREngine
from protocols.blood_test import analyze_blood_test
from protocols.lipid_panel import analyze_lipid_panel
from protocols.liver_function import analyze_liver_function
from protocols.diabetes_screening import analyze_diabetes_screening
from protocols.kidney_function import analyze_kidney_function

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python main.py <protocol> <image_path>"}))
        return

    protocol = sys.argv[1].lower()
    image_path = sys.argv[2]

    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}))
        return

    engine = MedicalOCREngine()
    
    # 1. Extract Text
    extracted_text = engine.extract_text(image_path)
    if "OCR Error" in extracted_text:
        print(json.dumps({"error": extracted_text}))
        return

    # 2. Route to Protocol
    loaders = {
        'blood_test': analyze_blood_test,
        'lipid_panel': analyze_lipid_panel,
        'liver_function': analyze_liver_function,
        'diabetes_screening': analyze_diabetes_screening,
        'kidney_function': analyze_kidney_function,
    }

    if protocol in loaders:
        analysis_result = loaders[protocol](extracted_text, engine)
        # Include the extracted text for transparency if needed
        analysis_result['extracted_text'] = extracted_text
        print(json.dumps(analysis_result, indent=2))
    else:
        print(json.dumps({
            "error": f"Unknown protocol: {protocol}",
            "available_protocols": list(loaders.keys())
        }))

if __name__ == "__main__":
    main()
