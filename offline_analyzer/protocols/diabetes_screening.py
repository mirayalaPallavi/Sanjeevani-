def analyze_diabetes_screening(extracted_text, engine):
    """
    Analyzes glucose levels and HbA1c for diabetes detection.
    """
    results = {
        'parameters': [],
        'suggestions': [],
        'summary': ""
    }

    ranges = {
        'glucose_fasting': {'max': 99, 'unit': 'mg/dL', 'name': 'Fasting Glucose'},
        'hba1c': {'max': 5.7, 'unit': '%', 'name': 'HbA1c'}
    }

    gluc_data = engine.find_parameter(extracted_text, ['glucose', 'fasting glucose', 'sugar'])
    hba1c_data = engine.find_parameter(extracted_text, ['hba1c', 'a1c', 'glycated'])

    if gluc_data:
        val = gluc_data[0]['value']
        status = "Normal"
        if 100 <= val <= 125:
            status = "Prediabetes"
            results['suggestions'].append("Fasting sugar is in the prediabetes range. Reduce refined carbohydrates and increase physical activity.")
        elif val >= 126:
            status = "Diabetes Range"
            results['suggestions'].append("Fasting sugar is high. Consult an endocrinologist for a formal diagnosis.")
        results['parameters'].append({'name': 'Fasting Glucose', 'value': val, 'status': status, 'range': f"< {ranges['glucose_fasting']['max']}"})

    if hba1c_data:
        val = hba1c_data[0]['value']
        status = "Normal"
        if 5.7 <= val <= 6.4:
            status = "Prediabetes"
            results['suggestions'].append("HbA1c indicates prediabetes. Focus on long-term weight management and dietary changes.")
        elif val >= 6.5:
            status = "Diabetes Range"
            results['suggestions'].append("HbA1c is in the diabetes range. Seek professional medical consultation for management.")
        results['parameters'].append({'name': 'HbA1c', 'value': val, 'status': status, 'range': f"< {ranges['hba1c']['max']}"})

    results['summary'] = "Diabetes screening analysis complete." if results['parameters'] else "Glucose or HbA1c markers not detected."
    return results
