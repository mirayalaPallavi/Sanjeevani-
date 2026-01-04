def analyze_blood_test(extracted_text, engine):
    """
    Analyzes a blood test report (CBC) and provides suggestions.
    """
    results = {
        'parameters': [],
        'suggestions': [],
        'summary': ""
    }

    # Define ranges (Standard reference)
    ranges = {
        'hemoglobin': {'min': 12.0, 'max': 17.5, 'unit': 'g/dL', 'name': 'Hemoglobin'},
        'wbc': {'min': 4500, 'max': 11000, 'unit': 'cells/mcL', 'name': 'WBC Count'},
        'platelets': {'min': 150000, 'max': 450000, 'unit': 'mcL', 'name': 'Platelets'}
    }

    # Extract parameters
    hb_data = engine.find_parameter(extracted_text, ['hemoglobin', 'hb', 'hgb'])
    wbc_data = engine.find_parameter(extracted_text, ['wbc', 'white blood', 'leukocyte'])
    plt_data = engine.find_parameter(extracted_text, ['platelet', 'plt'])

    # Processing Hb
    if hb_data:
        val = hb_data[0]['value']
        status = "Normal"
        if val < ranges['hemoglobin']['min']:
            status = "Low (Anemic Risk)"
            results['suggestions'].append("Increase iron intake (spinach, red meat, lentils) and consult a doctor about iron supplements.")
        elif val > ranges['hemoglobin']['max']:
            status = "High"
        results['parameters'].append({'name': 'Hemoglobin', 'value': val, 'status': status, 'range': f"{ranges['hemoglobin']['min']}-{ranges['hemoglobin']['max']}"})

    # Processing WBC
    if wbc_data:
        val = wbc_data[0]['value']
        status = "Normal"
        if val < ranges['wbc']['min']:
            status = "Low"
            results['suggestions'].append("Low WBC might indicate a weakened immune system. Avoid exposure to infections.")
        elif val > ranges['wbc']['max']:
            status = "High (Potential Infection)"
            results['suggestions'].append("High WBC count often indicates the body is fighting an infection. Rest and hydration are key.")
        results['parameters'].append({'name': 'WBC Count', 'value': val, 'status': status, 'range': f"{ranges['wbc']['min']}-{ranges['wbc']['max']}"})

    # Processing Platelets
    if plt_data:
        val = plt_data[0]['value']
        status = "Normal"
        if val < ranges['platelets']['min']:
            status = "Low"
            results['suggestions'].append("Low platelets increase bleeding risk. Seek medical advice if you notice easy bruising.")
        results['parameters'].append({'name': 'Platelets', 'value': val, 'status': status, 'range': f"{ranges['platelets']['min']}-{ranges['platelets']['max']}"})

    if not results['parameters']:
        results['summary'] = "No clear blood biomarkers detected. Please ensure the report image is clear."
    else:
        results['summary'] = "Blood test analysis complete. See parameters for flags."

    return results
