import pytesseract
from PIL import Image
import re
import cv2
import numpy as np

class MedicalOCREngine:
    def __init__(self, tesseract_cmd=None):
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def preprocess_image(self, image_path):
        """Basic preprocessing to improve OCR accuracy."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image at {image_path}")
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Adaptive thresholding or simple thresholding
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return thresh

    def extract_text(self, image_path):
        """Extracts text from a medical report image."""
        try:
            processed_img = self.preprocess_image(image_path)
            # OCR with default config
            text = pytesseract.image_to_string(processed_img)
            return text
        except Exception as e:
            return f"OCR Error: {str(e)}"

    def find_parameter(self, text, keywords, pattern=r'(\d+\.?\d*)\s*([a-zA-Z/%/u/L/m/g]*)'):
        """
        Generic parameter finder using regex.
        Looks for keywords followed by a number and optionally units.
        """
        results = []
        lines = text.split('\n')
        for line in lines:
            if any(keyword.lower() in line.lower() for keyword in keywords):
                match = re.search(pattern, line)
                if match:
                    value = float(match.group(1))
                    unit = match.group(2)
                    results.append({'value': value, 'unit': unit, 'raw': line.strip()})
        return results
