import cv2
import numpy as np
import json
import os
from data_models import KNOWLEDGE_BASE

class VisualDiagnosisEngine:
    def __init__(self):
        pass

    def preprocess(self, image_path: str):
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Image not found at {image_path}")
        
        # 1. Resize for consistent analysis
        img = cv2.resize(img, (800, 800))
        
        # 2. Denoise using Bilateral Filter (preserves edges)
        denoised = cv2.bilateralFilter(img, 9, 75, 75)
        
        # 3. Enhance Contrast using CLAHE
        lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        
        return img, enhanced

    def detect_anomalies(self, original, enhanced):
        hsv = cv2.cvtColor(enhanced, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
        
        results = []
        
        # --- RASH / BURN / REDNESS ---
        lower_red1, upper_red1 = np.array([0, 100, 100]), np.array([10, 255, 255])
        lower_red2, upper_red2 = np.array([160, 100, 100]), np.array([179, 255, 255])
        red_mask = cv2.add(cv2.inRange(hsv, lower_red1, upper_red1), cv2.inRange(hsv, lower_red2, upper_red2))
        
        # --- BRUISE / DISCOLORATION ---
        bruise_mask = cv2.inRange(hsv, np.array([110, 40, 20]), np.array([150, 255, 180]))
        
        # --- MINOR INJURIES (light redness, small scrapes) ---
        # Detect lighter red/pink areas that aren't intense enough to be burns
        light_red_mask = cv2.inRange(hsv, np.array([0, 30, 80]), np.array([20, 120, 200]))
        
        # --- CUTS / WOUNDS ---
        edges = cv2.Canny(gray, 40, 120)
        dilated = cv2.dilate(edges, np.ones((5,5), np.uint8), iterations=1)

        # REDNESS Analysis - distinguish between burns and minor injuries
        contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 1200:
                x, y, w, h = cv2.boundingRect(cnt)
                
                # Calculate intensity to distinguish burns from minor injuries
                roi = hsv[y:y+h, x:x+w]
                avg_saturation = np.mean(roi[:,:,1])
                avg_value = np.mean(roi[:,:,2])
                
                # Burns typically have very high saturation and value
                # Minor injuries have moderate saturation
                if avg_saturation > 150 and avg_value > 180 and area > 25000:
                    label = "Burn"
                elif area > 15000 and avg_saturation > 120:
                    label = "Rash / Inflammation"
                else:
                    label = "Minor Injury / Scrape"
                    
                results.append({"label": label, "area": int(area), "bbox": [int(x), int(y), int(w), int(h)]})

        # LIGHT REDNESS (Minor injuries) - for areas not caught above
        light_contours, _ = cv2.findContours(light_red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in light_contours:
            area = cv2.contourArea(cnt)
            if 800 < area < 15000:  # Smaller areas that are lightly red
                x, y, w, h = cv2.boundingRect(cnt)
                # Check if this area doesn't overlap with existing detections
                is_new = True
                for existing in results:
                    ex, ey, ew, eh = existing['bbox']
                    if abs(x - ex) < 50 and abs(y - ey) < 50:
                        is_new = False
                        break
                if is_new:
                    results.append({"label": "Minor Injury / Scrape", "area": int(area), "bbox": [int(x), int(y), int(w), int(h)]})

        # BRUISE Analysis
        contours, _ = cv2.findContours(bruise_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 1500:
                x, y, w, h = cv2.boundingRect(cnt)
                results.append({"label": "Bruise / Contusion", "area": int(area), "bbox": [int(x), int(y), int(w), int(h)]})

        # CUTS Analysis
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            area = cv2.contourArea(cnt)
            rect = cv2.minAreaRect(cnt)
            _, (cw, ch), _ = rect
            aspect_ratio = max(cw, ch) / (min(cw, ch) + 1e-5)
            if area > 400 and aspect_ratio > 3.5:
                x, y, w, h = cv2.boundingRect(cnt)
                results.append({"label": "Cut / Wound", "area": int(area), "bbox": [int(x), int(y), int(w), int(h)]})

        return results

    def analyze(self, image_path: str):
        try:
            original, enhanced = self.preprocess(image_path)
            anomalies = self.detect_anomalies(original, enhanced)
            
            if not anomalies:
                return {
                    "label": "Other anomalies",
                    "confidence": 0.35, "severity": "Mild",
                    "description": "Detected a minor skin variation. If you feel pain, consult a specialist.",
                    "advice": ["Keep the area clean.", "Monitor for 24h."],
                    "next_steps": ["Observe for any changes."], "annotations": []
                }
            
            anomalies.sort(key=lambda x: x['area'], reverse=True)
            primary = anomalies[0]
            unique_labels = list(set([a['label'] for a in anomalies]))
            
            severity = "Mild"
            if primary['area'] > 12000 or len(anomalies) > 3: severity = "Moderate"
            if primary['area'] > 40000: severity = "Severe"
            confidence = min(0.65 + (len(anomalies) * 0.05), 0.95)

            # Heuristics for body parts (placeholder for real CV segmentation)
            body_part = "Detected Limb/Area" 
            
            # Map result to knowledge base
            kb_data = KNOWLEDGE_BASE.get(primary['label'], {
                "description": "Detected a skin anomaly requiring observation.",
                "advice": ["Keep the area clean.", "Avoid irritating the site."],
                "next_steps": ["Monitor for changes in size or color."]
            })

            return {
                "label": primary['label'],
                "confidence": round(confidence, 2),
                "severity": severity,
                "is_multi": len(unique_labels) > 1,
                "detected_part": body_part,
                "all_detected": unique_labels,
                "description": kb_data["description"],
                "advice": kb_data["advice"],
                "next_steps": kb_data["next_steps"],
                "annotations": [{
                    "x": round(a['bbox'][0]/8, 1), 
                    "y": round(a['bbox'][1]/8, 1), 
                    "w": round(a['bbox'][2]/8, 1), 
                    "h": round(a['bbox'][3]/8, 1)
                } for a in anomalies[:4]]
            }
        except Exception as e:
            return {"error": str(e)}
