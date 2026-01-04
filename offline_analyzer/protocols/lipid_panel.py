def analyze_lipid_panel(extracted_text, engine):
    """
    Analyzes lipid profile reports (Cholesterol, HDL, LDL, Triglycerides).
    """
    results = {
        'parameters': [],
        'suggestions': [],
        'summary': ""
    }

    ranges = {
        'cholesterol': {'max': 200, 'unit': 'mg/dL', 'name': 'Total Cholesterol'},
        'hdl': {'min': 40, 'unit': 'mg/dL', 'name': 'HDL (Good) Cholesterol'},
        'ldl': {'max': 100, 'unit': 'mg/dL', 'name': 'LDL (Bad) Cholesterol'},
        'triglycerides': {'max': 150, 'unit': 'mg/dL', 'name': 'Triglycerides'}
    }

    # Extract
    chol_data = engine.find_parameter(extracted_text, ['total cholesterol', 'cholesterol'])
    hdl_data = engine.find_parameter(extracted_text, ['hdl', 'high density'])
    ldl_data = engine.find_parameter(extracted_text, ['ldl', 'low density'])
    tri_data = engine.find_parameter(extracted_text, ['triglycerides', 'tri'])

    if chol_data:
        val = chol_data[0]['value']
        status = "Normal" if val < ranges['cholesterol']['max'] else "High"
        if status == "High":
            results['suggestions'].append("High total cholesterol. Consider reducing saturated fats and increasing fiber intake.")
        results['parameters'].append({'name': 'Total Cholesterol', 'value': val, 'status': status, 'range': f"< {ranges['cholesterol']['max']}"})

    if hdl_data:
        val = hdl_data[0]['value']
        status = "Normal" if val > ranges['hdl']['min'] else "Low"
        if status == "Low":
            results['suggestions'].append("Low HDL (Good) Cholesterol. Aerobic exercise can help raise HDL levels.")
        results['parameters'].append({'name': 'HDL Cholesterol', 'value': val, 'status': status, 'range': f"> {ranges['hdl']['min']}"})

    if ldl_data:
        val = ldl_data[0]['value']
        status = "Normal" if val < ranges['ldl']['max'] else "High"
        if status == "High":
            results['suggestions'].append("High LDL (Bad) Cholesterol. This is a risk factor for heart disease. Consult a doctor about diet or medication.")
        results['parameters'].append({'name': 'LDL Cholesterol', 'value': val, 'status': status, 'range': f"< {ranges['ldl']['max']}"})

    if tri_data:
        val = tri_data[0]['value']
        status = "Normal" if val < ranges['triglycerides']['max'] else "High"
        if status == "High":
            results['suggestions'].append("High Triglycerides. Avoid sugary drinks and refined carbs. Increase Omega-3 intake.")
        results['parameters'].append({'name': 'Triglycerides', 'value': val, 'status': status, 'range': f"< {ranges['triglycerides']['max']}"})

    results['summary'] = "Lipid profile analysis complete." if results['parameters'] else "Could not detect lipid markers."
    return results
