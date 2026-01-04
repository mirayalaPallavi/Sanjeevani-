export const LAB_MARKERS = {
    blood_test: [
        { name: "Hemoglobin (Hb)", range: "13.5-17.5 g/dL (Men), 12.0-15.5 g/dL (Women)", importance: "Oxygen transport. Low indicates anemia." },
        { name: "WBC Count", range: "4,500-11,000 cells/mcL", importance: "Immune health. High indicates infection." },
        { name: "Platelets", range: "150,000-450,000 /mcL", importance: "Blood clotting. Low causes bleeding risks." },
        { name: "Glucose (Fasting)", range: "70-99 mg/dL", importance: "Blood sugar levels. High indicates diabetes/prediabetes." },
        { name: "Total Cholesterol", range: "< 200 mg/dL", importance: "Heart health. High increases cardiovascular risk." },
        { name: "Creatinine", range: "0.7-1.3 mg/dL (Men), 0.6-1.1 mg/dL (Women)", importance: "Kidney function." },
        { name: "ALT (Alanine Aminotransferase)", range: "7-55 units/L", importance: "Liver health." }
    ],
    lipid_panel: [
        { name: "HDL (Good) Cholesterol", range: "> 40-60 mg/dL", importance: "Protects against heart disease." },
        { name: "LDL (Bad) Cholesterol", range: "< 100 mg/dL", importance: "Increases risk of heart disease." },
        { name: "Triglycerides", range: "< 150 mg/dL", importance: "Fat in the blood." }
    ]
};

export const CLINICAL_LOGIC = {
    fever: {
        low_grade: "37.5°C - 38.3°C",
        high_grade: "> 38.4°C",
        emergencies: ["Stiff neck", "Confusion", "Persistent vomiting", "Seizure"]
    },
    chest_pain: {
        emergency_indicators: ["Pain radiating to arm/jaw", "Shortness of breath", "Pressure/Tightness", "Cold sweat"],
        action: "Call emergency services immediately."
    }
};
