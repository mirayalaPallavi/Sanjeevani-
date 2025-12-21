import { TriageResponse } from '@/types/database';

export interface OfflineSymptomData {
    keywords: string[];
    response: TriageResponse;
}

export const offlineSymptoms: OfflineSymptomData[] = [
    // --- RESPIRATORY ---
    {
        keywords: ['fever', 'high temperature', 'chills', 'shivering'],
        response: {
            urgency: 'medium',
            confidence: 85,
            predicted_conditions: ['Viral Fever', 'Flu', 'Infection', 'Typhoid'],
            recommended_specialization: 'General Physician',
            advice: 'Monitor your temperature regularly. Stay hydrated and rest. If temperature exceeds 103°F (39.4°C) or lasts more than 3 days, see a doctor.',
            warning_signs: ['Stiff neck', 'Confusion', 'Difficulty breathing', 'Severe headache', 'Seizures'],
            self_care_tips: [
                'Drink plenty of fluids (water, herbal tea)',
                'Rest and sleep significantly more than usual',
                'Use cool compresses on forehead',
                'Homeopathy: Belladonna 30C for sudden, high fever with flushed face',
                'Homeopathy: Ferrum Phos 6X for mild fever with inflammation',
                'Homeopathy: Aconite 30C for sudden onset after exposure to cold wind'
            ]
        }
    },
    {
        keywords: ['cough', 'dry cough', 'wet cough', 'sore throat', 'hoarseness'],
        response: {
            urgency: 'low',
            confidence: 80,
            predicted_conditions: ['Common Cold', 'Bronchitis', 'Pharyngitis', 'Laryngitis'],
            recommended_specialization: 'General Physician',
            advice: 'A cough is often viral. Isolate if infectious. Consult a doctor if it persists for more than 3 weeks.',
            warning_signs: ['Coughing up blood', 'Severe chest pain', 'Difficulty breathing', 'High fever > 102°F'],
            self_care_tips: [
                'Stay hydrated with warm fluids',
                'Gargle with warm salt water',
                'Use honey in tea or warm water',
                'Steam inhalation',
                'Homeopathy: Bryonia 30C for dry, painful cough made worse by movement',
                'Homeopathy: Hepar Sulph 30C for loose, rattling cough with yellow phlegm',
                'Homeopathy: Drosera 30C for spasmodic, barking cough'
            ]
        }
    },
    {
        keywords: ['asthma', 'wheezing', 'shortness of breath', 'tight chest'],
        response: {
            urgency: 'high',
            confidence: 90,
            predicted_conditions: ['Asthma Attack', 'Bronchospasm', 'Allergic Reaction'],
            recommended_specialization: 'Pulmonologist',
            advice: 'Use your rescue inhaler immediately if prescribed. Sit upright. If symptoms do not improve, seek emergency help.',
            warning_signs: ['Blue lips/face', 'Extreme difficulty breathing', 'Inhaler not working', 'Confusion'],
            self_care_tips: [
                'Sit upright, do not lie down',
                'Stay calm and breathe slowly',
                'Remove tight clothing',
                'Homeopathy: Arsenicum Album 30C for anxiety with breathlessness, worse at night',
                'Homeopathy: Ipecac 30C for wheezing with nausea',
                'Homeopathy: Spongia Tosta 30C for dry, croupy cough with wheezing'
            ]
        }
    },
    {
        keywords: ['sinus', 'sinusitis', 'blocked nose', 'facial pain', 'runny nose'],
        response: {
            urgency: 'low',
            confidence: 85,
            predicted_conditions: ['Sinusitis', 'Allergic Rhinitis', 'Common Cold'],
            recommended_specialization: 'ENT Specialist',
            advice: 'Relieve congestion and inflammation. Most cases resolve on their own.',
            warning_signs: ['Severe headache', 'Stiff neck', 'Swelling around eyes', 'High fever'],
            self_care_tips: [
                'Steam inhalation with eucalyptus oil',
                'Warm compress over face',
                'Nasal saline irrigation (Neti pot)',
                'Homeopathy: Kali Bich 30C for thick, stringy yellow/green discharge',
                'Homeopathy: Pulsatilla 30C for congestion in warm rooms, better in fresh air',
                'Homeopathy: Silicea 6X for chronic sinus issues'
            ]
        }
    },

    // --- DIGESTIVE ---
    {
        keywords: ['stomach pain', 'abdominal pain', 'cramps', 'belly ache'],
        response: {
            urgency: 'medium',
            confidence: 75,
            predicted_conditions: ['Gastroenteritis', 'Indigestion', 'Gastritis', 'IBS'],
            recommended_specialization: 'Gastroenterologist',
            advice: 'Avoid solid foods for a few hours. Sip clear fluids. If pain is severe/sharp, seek help.',
            warning_signs: ['Blood in stool/vomit', 'Severe continuous pain', 'Rigid abdomen', 'Fever over 102°F'],
            self_care_tips: [
                'Drink clear fluids (water, broth)',
                'Apply a heating pad to the abdomen',
                'Avoid dairy, caffeine, and spicy foods',
                'Homeopathy: Nux Vomica 30C for pain after overeating or spicy food',
                'Homeopathy: Colocynthis 30C for severe cramping better with pressure/bending double',
                'Homeopathy: Mag Phos 6X for cramping pain relieved by heat'
            ]
        }
    },
    {
        keywords: ['acid reflux', 'heartburn', 'gerd', 'burning chest'],
        response: {
            urgency: 'low',
            confidence: 85,
            predicted_conditions: ['GERD', 'Acid Reflux', 'Indigestion'],
            recommended_specialization: 'Gastroenterologist',
            advice: 'Manage diet and lifestyle. Avoid lying down immediately after eating.',
            warning_signs: ['Difficulty swallowing', 'Unexplained weight loss', 'Black stools', 'Chest pain radiating to arm'],
            self_care_tips: [
                'Eat smaller meals',
                'Avoid triggers (citrus, chocolate, caffeine)',
                'Elevate head of bed',
                'Homeopathy: Carbo Veg 30C for bloating and indigestion with simple food',
                'Homeopathy: Robina 30C for intense acidity and sour belching',
                'Homeopathy: Lycopodium 30C for bloating and gas'
            ]
        }
    },
    {
        keywords: ['bloating', 'gas', 'flatulence', 'distended stomach'],
        response: {
            urgency: 'low',
            confidence: 80,
            predicted_conditions: ['Flatulence', 'IBS', 'Lactose Intolerance'],
            recommended_specialization: 'Gastroenterologist',
            advice: 'Identify dietary triggers. Exercise can help move gas through the system.',
            warning_signs: ['Severe abdominal pain', 'Change in bowel habits', 'Blood in stool'],
            self_care_tips: [
                'Walk or do light yoga',
                'Drink peppermint tea',
                'Avoid carbonated drinks and chewing gum',
                'Homeopathy: Carbo Veg 30C for upper abdominal boating',
                'Homeopathy: Lycopodium 30C for lower abdominal bloating',
                'Homeopathy: China Officinalis 30C for excessive gas and bloating'
            ]
        }
    },
    {
        keywords: ['constipation', 'hard stool', 'inability to poop'],
        response: {
            urgency: 'low',
            confidence: 85,
            predicted_conditions: ['Functional Constipation', 'IBS-C', 'Low Fiber Diet'],
            recommended_specialization: 'General Physician',
            advice: 'Increase fiber and water intake. Regular exercise stimulates bowel movements.',
            warning_signs: ['Severe abdominal pain', 'Blood in stool', 'Unexplained weight loss'],
            self_care_tips: [
                'Drink plenty of water',
                'Eat high-fiber foods (fruits, vegetables, prunes)',
                'Exercise regularly',
                'Homeopathy: Bryonia 30C for dry, hard stools',
                'Homeopathy: Nux Vomica 30C for ineffectual urge to pass stool',
                'Homeopathy: Silicea 30C for difficulty expelling stool'
            ]
        }
    },
    {
        keywords: ['diarrhea', 'loose motion', 'loose stool'],
        response: {
            urgency: 'medium',
            confidence: 80,
            predicted_conditions: ['Gastroenteritis', 'Food Poisoning', 'IBS-D'],
            recommended_specialization: 'General Physician',
            advice: 'Focus on rehydration to replace lost fluids and electrolytes.',
            warning_signs: ['Signs of dehydration', 'Blood or pus in stool', 'Severe pain', 'Fever > 102°F'],
            self_care_tips: [
                'Oral Rehydration Solution (ORS)',
                'BRAT diet (Bananas, Rice, Applesauce, Toast)',
                'Avoid dairy and fatty foods',
                'Homeopathy: Arsenicum Album 30C for diarrhea from food poisoning',
                'Homeopathy: Podophyllum 30C for profuse, watery, forceful stool',
                'Homeopathy: Aloe Socotrina 30C for sudden urge immediately after eating'
            ]
        }
    },
    {
        keywords: ['nausea', 'vomiting', 'puking', 'sickness'],
        response: {
            urgency: 'medium',
            confidence: 80,
            predicted_conditions: ['Viral Gastroenteritis', 'Food Poisoning', 'Motion Sickness', 'Migraine'],
            recommended_specialization: 'General Physician',
            advice: 'Rest stomach for 1-2 hours. Start with small sips of water. If vomiting persists >24hrs, seek help.',
            warning_signs: ['Blood/coffee-ground vomit', 'Severe dehydration', 'Severe headache', 'Stiff neck'],
            self_care_tips: [
                'Ginger tea or chews',
                'Sip clear fluids slowly',
                'Acupressure wrist bands',
                'Homeopathy: Ipecac 30C for persistent nausea not relieved by vomiting',
                'Homeopathy: Nux Vomica 30C for nausea after overindulgence',
                'Homeopathy: Arsenicum Album 30C for vomiting with anxiety and weakness'
            ]
        }
    },

    // --- HEAD & NEURO ---
    {
        keywords: ['headache', 'head pain'],
        response: {
            urgency: 'low',
            confidence: 80,
            predicted_conditions: ['Tension Headache', 'Migraine', 'Dehydration', 'Sinus Headache'],
            recommended_specialization: 'General Physician',
            advice: 'Most headaches are managed with rest and hydration. If sudden and severe ("thunderclap"), seek immediate help.',
            warning_signs: ['Visual disturbances', 'Slurred speech', 'Numbness', 'Headache after head injury'],
            self_care_tips: [
                'Rest in a quiet, dark room',
                'Drink water',
                'Apply a cold/warm compress',
                'Homeopathy: Belladonna 30C for throbbing headache',
                'Homeopathy: Bryonia 30C for headache worse with movement',
                'Homeopathy: Iris Versicolor 30C for migraine with aura/visual blur'
            ]
        }
    },
    {
        keywords: ['migraine', 'severe headache', 'one sided headache'],
        response: {
            urgency: 'medium',
            confidence: 85,
            predicted_conditions: ['Migraine', 'Cluster Headache'],
            recommended_specialization: 'Neurologist',
            advice: 'Take medication at first sign. Rest in dark, quiet room.',
            warning_signs: ['Worst headache of life', 'Vision loss', 'Difficulty speaking', 'Loss of balance'],
            self_care_tips: [
                'Dark room rest',
                'Cold pack on forehead',
                'Caffeine (in small amounts can help)',
                'Homeopathy: Belladonna 30C for throbbing, heat, lights sensitivity',
                'Homeopathy: Spigelia 30C for left-sided migraine involving eye',
                'Homeopathy: Sanguinaria 30C for right-sided migraine'
            ]
        }
    },
    {
        keywords: ['dizziness', 'vertigo', 'lightheaded', 'spinning'],
        response: {
            urgency: 'medium',
            confidence: 75,
            predicted_conditions: ['BPPV (Vertigo)', 'Dehydration', 'Low Blood Pressure', 'Inner Ear Infection'],
            recommended_specialization: 'ENT Specialist',
            advice: 'Sit or lie down immediately to prevent falling. Move slowly.',
            warning_signs: ['Fainting', 'Chest pain', 'Severe headache', 'Hearing loss', 'Double vision'],
            self_care_tips: [
                'Epley maneuver (if known BPPV)',
                'Drink water',
                'Fix gaze on a stationary object',
                'Homeopathy: Cocculus Indicus 30C for vertigo with nausea (motion sickness)',
                'Homeopathy: Conium Mac 30C for vertigo when turning head',
                'Homeopathy: Gelsemium 30C for dizziness with drowsiness'
            ]
        }
    },
    {
        keywords: ['insomnia', 'sleeplessness', 'cant sleep'],
        response: {
            urgency: 'low',
            confidence: 80,
            predicted_conditions: ['Insomnia', 'Stress', 'Anxiety', 'Poor Sleep Hygiene'],
            recommended_specialization: 'General Physician',
            advice: 'Consistent sleep schedule and relaxing bedtime routine are key.',
            warning_signs: ['Falling asleep while driving', 'Severe depression', 'Memory loss'],
            self_care_tips: [
                'Avoid screens 1 hour before bed',
                'Keep room cool and dark',
                'Chamomile tea',
                'Homeopathy: Coffea Cruda 30C for racing thoughts preventing sleep',
                'Homeopathy: Ignatia 30C for insomnia from grief/upset',
                'Homeopathy: Passiflora Incarnata 30C (or Mother Tincture) for general calming'
            ]
        }
    },

    // --- MUSCULOSKELETAL ---
    {
        keywords: ['back pain', 'lower back pain', 'sciatica'],
        response: {
            urgency: 'low',
            confidence: 85,
            predicted_conditions: ['Muscle Strain', 'Herniated Disc', 'Sciatica', 'Poor Posture'],
            recommended_specialization: 'Orthopedist',
            advice: 'Keep moving gently; bed rest can make it worse. Use heat/cold therapy.',
            warning_signs: ['Loss of bladder/bowel control', 'Numbness in groin area', 'Fever', 'History of cancer'],
            self_care_tips: [
                'Apply heat or cold packs',
                'Gentle walking',
                'Avoid heavy lifting',
                'Homeopathy: Rhus Tox 30C for pain worse on first motion, better with continued movement',
                'Homeopathy: Arnica 30C for sore, bruised feeling',
                'Homeopathy: Hypericum 30C for shooting nerve pain (sciatica)'
            ]
        }
    },
    {
        keywords: ['joint pain', 'knee pain', 'arthritis'],
        response: {
            urgency: 'low',
            confidence: 80,
            predicted_conditions: ['Osteoarthritis', 'Rheumatoid Arthritis', 'Tendinitis'],
            recommended_specialization: 'Orthopedist',
            advice: 'Manage weight to reduce load. Low-impact exercise is beneficial.',
            warning_signs: ['Hot, red, swollen joint', 'Fever', 'Sudden inability to move joint'],
            self_care_tips: [
                'Warm baths/compresses',
                'Gentle swimming or cycling',
                'Turmeric supplements (anti-inflammatory)',
                'Homeopathy: Rhus Tox 30C for stirfness better with motion',
                'Homeopathy: Bryonia 30C for pain worse with ANY motion',
                'Homeopathy: Ruta Grav 30C for tendon/ligament injuries'
            ]
        }
    },
    {
        keywords: ['cramps', 'muscle cramp', 'charley horse'],
        response: {
            urgency: 'low',
            confidence: 85,
            predicted_conditions: ['Muscle Fatigue', 'Dehydration', 'Electrolyte Imbalance'],
            recommended_specialization: 'General Physician',
            advice: 'Gently stretch the muscle. Hydrate immediately.',
            warning_signs: ['Severe swelling', 'Redness', 'Muscle weakness'],
            self_care_tips: [
                'Stretch and massage the muscle',
                'Apply heat',
                'Drink electrolyte water',
                'Homeopathy: Mag Phos 6X for spasmodic cramps (dissolve in warm water)',
                'Homeopathy: Cuprum Met 30C for violent Cramps',
                'Homeopathy: Calcarea Carb 30C for foot cramps'
            ]
        }
    },
    {
        keywords: ['sprain', 'strain', 'twisted ankle', 'injury'],
        response: {
            urgency: 'low',
            confidence: 80,
            predicted_conditions: ['Ligament Sprain', 'Muscle Strain'],
            recommended_specialization: 'Orthopedist',
            advice: 'Protect the area and reduce swelling initially.',
            warning_signs: ['Inability to bear weight', 'Deformity of joint', 'Severe pain', 'Numbness'],
            self_care_tips: [
                'R.I.C.E. (Rest, Ice, Compression, Elevation)',
                'Avoid putting weight on injury',
                'Homeopathy: Arnica 30C immediately for shock and bruising',
                'Homeopathy: Ruta Grav 30C for cartilage/tendon injury',
                'Homeopathy: Rhus Tox 30C for ligament strain'
            ]
        }
    },

    // --- SKIN ---
    {
        keywords: ['acne', 'pimples', 'zits'],
        response: {
            urgency: 'low',
            confidence: 90,
            predicted_conditions: ['Acne Vulgaris', 'Hormonal Acne'],
            recommended_specialization: 'Dermatologist',
            advice: 'Keep skin clean but do not over-wash. Avoid popping pimples.',
            warning_signs: ['Deep, painful cysts', 'Scarring', 'Signs of infection'],
            self_care_tips: [
                'Use gentle cleanser',
                'Apply tea tree oil (diluted)',
                'Change pillowcases frequently',
                'Homeopathy: Hepar Sulph 30C for painful, pus-filled pimples',
                'Homeopathy: Pulsatilla 30C for hormonal acne',
                'Homeopathy: Kali Brom 30C for deep acne'
            ]
        }
    },
    {
        keywords: ['rash', 'itching', 'hives', 'urticaria'],
        response: {
            urgency: 'low',
            confidence: 75,
            predicted_conditions: ['Allergic Reaction', 'Eczema', 'Contact Dermatitis'],
            recommended_specialization: 'Dermatologist',
            advice: 'Identify trigger (food, plant, soap). Keep area cool.',
            warning_signs: ['Swelling of lips/tongue', 'Difficulty breathing (Anaphylaxis)', 'Rapid spread'],
            self_care_tips: [
                'Cold compress',
                'Oatmeal bath',
                'Wear loose cotton clothing',
                'Homeopathy: Apis Mel 30C for red, hot, swollen stinging rash',
                'Homeopathy: Urtica Urens 30C for stinging hives',
                'Homeopathy: Sulphur 30C for intense itching worse with heat'
            ]
        }
    },
    {
        keywords: ['insect bite', 'bee sting', 'bug bite'],
        response: {
            urgency: 'low',
            confidence: 85,
            predicted_conditions: ['Insect Bite Reaction'],
            recommended_specialization: 'General Physician',
            advice: 'Remove stinger if present. Clean area.',
            warning_signs: ['Difficulty breathing', 'Swelling of face/throat', 'Dizziness', 'Hives all over body'],
            self_care_tips: [
                'Apply ice pack',
                'Apply baking soda paste',
                'Elevate if swollen',
                'Homeopathy: Ledum Pal 30C for puncture wounds/bites (prevention of tetanus)',
                'Homeopathy: Apis Mel 30C for hot swelling from stings',
                'Homeopathy: Hypericum 30C for shooting pain from bites'
            ]
        }
    },
    {
        keywords: ['burn', 'scald'],
        response: {
            urgency: 'medium',
            confidence: 80,
            predicted_conditions: ['Thermal Burn'],
            recommended_specialization: 'General Physician',
            advice: 'Cool the burn effectively to stop tissue damage.',
            warning_signs: ['Charred skin', 'Burn > 3 inches', 'Burn on face/hands', 'Chemical burn'],
            self_care_tips: [
                'Run cool tap water (10-20 mins) - NOT ice',
                'Apply aloe vera',
                'Cover with sterile non-stick bandage',
                'Homeopathy: Cantharis 30C matches symptom of burning pain/blistering',
                'Homeopathy: Urtica Urens 30C for minor burns',
                'Homeopathy: Causticum 30C for deeper burns'
            ]
        }
    },
    {
        keywords: ['cut', 'wound', 'bleeding'],
        response: {
            urgency: 'medium',
            confidence: 85,
            predicted_conditions: ['Laceration', 'Abrasion'],
            recommended_specialization: 'General Physician',
            advice: 'Control bleeding and prevent infection.',
            warning_signs: ['Pulsing blood', 'Deep wound', 'Object embedded', 'Animal bite'],
            self_care_tips: [
                'Direct pressure',
                'Clean with water',
                'Antibiotic ointment',
                'Homeopathy: Arnica 30C for trauma',
                'Homeopathy: Hypericum 30C for injury to nerve-rich areas (fingertips)',
                'Homeopathy: Calendula (topical or 30C) to promote healing'
            ]
        }
    },

    // --- GENERAL / OTHER ---
    {
        keywords: ['dehydration', 'thirsty', 'dry mouth'],
        response: {
            urgency: 'medium',
            confidence: 90,
            predicted_conditions: ['Dehydration'],
            recommended_specialization: 'General Physician',
            advice: 'Replace fluids and electrolytes immediately.',
            warning_signs: ['Confusion', 'Fainting', 'No urine for 8+ hours', 'Rapid heartbeat'],
            self_care_tips: [
                'Sip water or electrolyte drinks',
                'Suck on ice chips',
                'Rest in cool place',
                'Homeopathy: China Officinalis 30C for dehydration after fluid loss',
                'Homeopathy: Veratrum Album 30C for collapse with cold sweat'
            ]
        }
    },
    {
        keywords: ['sunstroke', 'heat stroke', 'heat exhaustion'],
        response: {
            urgency: 'high',
            confidence: 85,
            predicted_conditions: ['Heat Exhaustion', 'Heat Stroke'],
            recommended_specialization: 'Emergency Medicine',
            advice: 'Move to cooler area immediately. Cool down the body.',
            warning_signs: ['Confusion', 'Loss of consciousness', 'Hot dry skin (no sweating)', 'Seizures'],
            self_care_tips: [
                'Move to shade/AC',
                'Cool wet cloths on neck/armpits',
                'Sip cool water (if conscious)',
                'Homeopathy: Glonoinum 30C for throbbing headache from sun',
                'Homeopathy: Belladonna 30C for hot, red face',
                'Homeopathy: Natrum Carb 30C for headache from sun'
            ]
        }
    },
    {
        keywords: ['anxiety', 'panic', 'stress'],
        response: {
            urgency: 'medium',
            confidence: 80,
            predicted_conditions: ['Generalized Anxiety', 'Panic Attack'],
            recommended_specialization: 'Psychiatrist',
            advice: 'Focus on breathing. Ground yourself.',
            warning_signs: ['Chest pain', 'Suicidal thoughts', 'Loss of reality'],
            self_care_tips: [
                'Box breathing (4-4-4-4)',
                'Limit caffeine',
                'Exercise',
                'Homeopathy: Aconite 30C for sudden panic/fear of death',
                'Homeopathy: Argentum Nit 30C for anticipatory anxiety',
                'Homeopathy: Gelsemium 30C for weakness/trembling from anxiety'
            ]
        }
    },
    {
        keywords: ['toothache', 'dental pain'],
        response: {
            urgency: 'medium',
            confidence: 90,
            predicted_conditions: ['Pulpitis', 'Abscess', 'Gum Infection'],
            recommended_specialization: 'Dentist',
            advice: 'See a dentist. Infection can spread.',
            warning_signs: ['Swelling face', 'Fever', 'Difficulty swallowing'],
            self_care_tips: [
                'Clove oil on cotton ball',
                'Salt water rinse',
                'Cold compress',
                'Homeopathy: Chamomilla 30C for unendurable pain',
                'Homeopathy: Coffea Cruda 30C for pain relieved by ice water',
                'Homeopathy: Mercurius Sol 30C for spongy gums/salivation'
            ]
        }
    },
    {
        keywords: ['chest pain', 'heart attack symptoms'],
        response: {
            urgency: 'emergency',
            confidence: 95,
            predicted_conditions: ['Myocardial Infarction', 'Angina'],
            recommended_specialization: 'Cardiologist',
            advice: 'Do not wait. Call emergency services.',
            warning_signs: ['Crushing pressure', 'Pain to arm/jaw', 'Sweating', 'Nausea'],
            self_care_tips: [
                'Call 911/Emergency',
                'Chew Aspirin (325mg)',
                'Unlock door',
                'Homeopathy: Aconite 30C for fear/shock while waiting for help',
                'Homeopathy: Cactus Grand 30C for sensation of constriction'
            ]
        }
    }
];
