def analyze_kidney_function(extracted_text, engine):
    """
    Analyzes kidney function markers (Creatinine, BUN, GFR).
    """
    results = {
        'parameters': [],
        'suggestions': [],
        'summary': ""
    }

    ranges = {
        'creatinine': {'min': 0.7, 'max': 1.3, 'unit': 'mg/dL', 'name': 'Creatinine'},
        'bun': {'min': 7, 'max': 20, 'unit': 'mg/dL', 'name': 'BUN (Blood Urea Nitrogen)'},
        'gfr': {'min': 90, 'unit': 'mL/min/1.73m2', 'name': 'eGFR'}
    }

    creat_data = engine.find_parameter(extracted_text, ['creatinine', 'creat'])
    bun_data = engine.find_parameter(extracted_text, ['bun', 'urea nitrogen'])
    gfr_data = engine.find_parameter(extracted_text, ['gfr', 'glomerular filtration'])

    if creat_data:
        val = creat_data[0]['value']
        status = "Normal"
        if val > ranges['creatinine']['max']:
            status = "High"
            results['suggestions'].append("High creatinine may indicate reduced kidney function. Stay hydrated and monitor protein intake.")
        results['parameters'].append({'name': 'Creatinine', 'value': val, 'status': status, 'range': f"{ranges['creatinine']['min']}-{ranges['creatinine']['max']}"})

    if bun_data:
        val = bun_data[0]['value']
        status = "Normal"
        if val > ranges['bun']['max']:
            status = "High"
            results['suggestions'].append("High BUN can indicates kidney issues or dehydration. Increase water intake.")
        results['parameters'].append({'name': 'BUN', 'value': val, 'status': status, 'range': f"{ranges['bun']['min']}-{ranges['bun']['max']}"})

    if gfr_data:
        val = gfr_data[0]['value']
        status = "Normal"
        if val < 60:
            status = "Low (Concern)"
            results['suggestions'].append("eGFR below 60 suggests possible chronic kidney disease. Consult a nephrologist.")
        elif val < 90:
            status = "Slightly Low"
        results['parameters'].append({'name': 'eGFR', 'value': val, 'status': status, 'range': f"> {ranges['gfr']['min']}"})

    results['summary'] = "Kidney function analysis complete." if results['parameters'] else "Kidney biomarkers not detected."
    return results
