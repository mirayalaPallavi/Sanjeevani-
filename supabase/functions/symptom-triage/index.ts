import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a medical triage AI assistant. Your role is to analyze symptoms and provide preliminary health guidance. 

IMPORTANT DISCLAIMERS:
- You are NOT providing a medical diagnosis
- You are providing general health information only
- Users should always consult a licensed healthcare provider
- In case of emergency, advise users to call emergency services immediately

Based on the symptoms provided, you must respond with a JSON object containing:
1. "urgency": one of "low", "medium", "high", or "emergency"
2. "confidence": number 0-100 indicating how confident you are in the assessment
3. "predicted_conditions": array of 1-5 possible conditions that could explain symptoms (not diagnoses)
4. "recommended_specialization": the type of doctor they should consult
5. "advice": brief general health advice (2-3 sentences)
6. "warning_signs": array of symptoms that would indicate immediate medical attention
7. "self_care_tips": array of 2-4 general self-care recommendations
8. "follow_up_questions": array of 2-3 questions to ask the patient for better assessment
9. "reasoning": brief explanation of your assessment logic

Urgency levels:
- "emergency": Life-threatening symptoms (chest pain, difficulty breathing, severe bleeding, stroke symptoms)
- "high": Serious symptoms requiring same-day medical attention
- "medium": Symptoms that should be evaluated within a few days
- "low": Minor symptoms that can be monitored

Confidence guidelines:
- 80-100: Clear symptom pattern, high certainty
- 60-79: Likely assessment but some ambiguity
- 40-59: Multiple possibilities, needs more info
- Below 40: Insufficient information

Always err on the side of caution. If in doubt, recommend a higher urgency level.
RESPOND ONLY WITH VALID JSON, NO MARKDOWN CODE BLOCKS.`;

    const userMessage = `Patient reports the following symptoms: ${symptoms.join(", ")}
    
Additional description: ${description || "No additional description provided"}

Please analyze these symptoms and provide your triage assessment as a JSON object.`;

    console.log("Calling Lovable AI Gateway for symptom triage...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errorText);
      throw new Error(`Lovable AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI Response received:", content);
    
    // Parse the JSON response
    let triageResult;
    try {
      // Handle markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      triageResult = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", e);
      // Provide a fallback response
      triageResult = {
        urgency: "medium",
        confidence: 50,
        predicted_conditions: ["Unable to analyze - please consult a doctor"],
        recommended_specialization: "General Practitioner",
        advice: "We recommend consulting with a healthcare provider for a proper evaluation.",
        warning_signs: ["Worsening symptoms", "New symptoms developing"],
        self_care_tips: ["Rest", "Stay hydrated", "Monitor symptoms"],
        follow_up_questions: ["How long have you had these symptoms?", "Have you taken any medication?"],
        reasoning: "Unable to fully analyze - professional evaluation recommended."
      };
    }

    return new Response(JSON.stringify(triageResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in symptom-triage function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
