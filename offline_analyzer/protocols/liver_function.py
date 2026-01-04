def analyze_liver_function(extracted_text, engine):
    """
    Analyzes liver function markers (ALT, AST, Bilirubin, Albumin).
    """
    results = {
        'parameters': [],
        'suggestions': [],
        'summary': ""
    }

    ranges = {
        'alt': {'max': 55, 'unit': 'U/L', 'name': 'ALT (Liver Enzyme)'},
        'ast': {'max': 40, 'unit': 'U/L', 'name': 'AST (Liver Enzyme)'},
        'bilirubin': {'max': 1.2, 'unit': 'mg/dL', 'name': 'Total Bilirubin'},
        'albumin': {'min': 3.4, 'max': 5.4, 'unit': 'g/dL', 'name': 'Albumin'}
    }

    alt_data = engine.find_parameter(extracted_text, ['alt', 'alanine'])
    ast_data = engine.find_parameter(extracted_text, ['ast', 'aspartate'])
    bil_data = engine.find_parameter(extracted_text, ['bilirubin', 'total bilirubin'])
    alb_data = engine.find_parameter(extracted_text, ['albumin', 'alb'])

    if alt_data:
        val = alt_data[0]['value']
        status = "Normal" if val < ranges['alt']['max'] else "High"
        if status == "High":
            results['suggestions'].append("Elevated ALT can indicate liver strain. Avoid alcohol and hepatotoxic medications.")
        results['parameters'].append({'name': 'ALT', 'value': val, 'status': status, 'range': f"< {ranges['alt']['max']}"})

    if ast_data:
        val = ast_data[0]['value']
        status = "Normal" if val < ranges['ast']['max'] else "High"
        results['parameters'].append({'name': 'AST', 'value': val, 'status': status, 'range': f"< {ranges['ast']['max']}"})

    if bil_data:
        val = bil_data[0]['value']
        status = "Normal" if val < ranges['bilirubin']['max'] else "High"
        if status == "High":
            results['suggestions'].append("High bilirubin levels should be clinically correlated for jaundice or biliary obstruction.")
        results['parameters'].append({'name': 'Total Bilirubin', 'value': val, 'status': status, 'range': f"< {ranges['bilirubin']['max']}"})

    if alb_data:
        val = alb_data[0]['value']
        status = "Normal" if ranges['albumin']['min'] < val < ranges['albumin']['max'] else ("Low" if val < ranges['albumin']['min'] else "High")
        if status == "Low":
            results['suggestions'].append("Low albumin may indicate liver or kidney issues, or malnourishment. Increase protein intake.")
        results['parameters'].append({'name': 'Albumin', 'value': val, 'status': status, 'range': f"{ranges['albumin']['min']}-{ranges['albumin']['max']}"})

    results['summary'] = "Liver function analysis complete." if results['parameters'] else "Liver biomarkers not detected."
    return results
