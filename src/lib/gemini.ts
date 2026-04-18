import type { UserProfile } from '../types/user';
import type { CyclePhase } from '../hooks/useCycleState';
import type { InteractionCheckResult, InteractionSeverity } from '../types/medication';
import type { VitalSign } from '../store/vitalsStore';
import type { Medication } from '../types/medication';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateCycleInsights(profile: UserProfile, phase: CyclePhase, daysIntoCycle: number, question?: string): Promise<string> {
  const age = profile.dateOfBirth 
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / 31557600000) 
    : 'Unknown';
    
  const conditions = profile.chronicConditions?.length 
    ? profile.chronicConditions.join(', ') 
    : 'None declared';

  const prompt = `You are a compassionate, medically-informed AI health assistant inside the Sanjivani OS.
Provide a highly personalized, non-diagnostic insight for a female user.
User Context:
- Current Cycle Phase: ${phase}
- Day of Cycle: ${daysIntoCycle}
- Age: ${age}
- Chronic Conditions: ${conditions}

${question ? `The user has asked the following specific question about her health/cycle: "${question}"

Please provide a clear, empathetic, and actionable answer directly addressing her question. Tailor your advice strictly considering that she is currently in the ${phase} phase (Day ${daysIntoCycle}).
Provide your response in plain text with clear paragraph breaks.` : `Please provide exactly three distinct paragraphs with clear headings (use standard uppercase formatting like "1. HORMONAL STATE:" rather than markdown boldings like **bold**) so it renders cleanly as plain text:
1. WHAT IS HAPPENING: A brief explanation of what is happening in the body hormonally right now.
2. NUTRITIONAL FUEL: Specific foods to eat to support healthy periods and hormonal balance tailored specifically for her current cycle phase.
3. PCOS / PCOD PREVENTION: Personalized tips on lifestyle, supplement, or holistic management to avoid or manage PCOS/PCOD.`}

Keep it uplifting, actionable, and relatively concise. Do not provide medical diagnoses.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error("Gemini context generation failed:", error);
    return "Failed to generate AI insights right now. Please check your connectivity and try again.";
  }
}

export async function checkDrugInteractions(
  newDrug: string,
  existingMeds: string[]
): Promise<InteractionCheckResult[]> {
  if (!existingMeds.length) return [];

  const prompt = `You are a medical AI API specialized in pharmacological interactions.
We are adding a new medication: "${newDrug}".
The user is currently taking: ${existingMeds.join(', ')}.

Analyze potential drug-drug interactions between the new medication and the existing ones.
Respond ONLY with a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json) or any conversational text.
If no interactions exist, return an empty array [].
Each object must have exactly these keys:
- "interactingDrugName" (string: name of the existing drug interacting)
- "severity" (string: must be one of "contraindicated", "major", "minor")
- "description" (string: clear, medical explanation of the risk)

JSON Output:`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    let text = data.candidates[0].content.parts[0].text.trim();
    if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '');
    }
    
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: any) => ({
      checkedAt: Date.now(),
      interactingDrugId: 'unknown',
      interactingDrugName: item.interactingDrugName || 'Unknown',
      severity: (item.severity as InteractionSeverity) || 'minor',
      description: item.description || 'Interaction detected',
      source: 'local'
    }));

  } catch (error) {
    console.error("Gemini interaction check failed:", error);
    return [];
  }
}

export async function generateVitalsChatResponse(
  question: string,
  profile: UserProfile | null,
  vitals: VitalSign[],
  medications: Medication[],
  history: {role: 'user' | 'model', content: string}[]
): Promise<string> {
  const age = profile?.dateOfBirth 
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / 31557600000) 
    : 'Unknown';

  const conditions = profile?.chronicConditions?.length 
    ? profile.chronicConditions.join(', ') 
    : 'None declared';

  const vitalsStr = vitals.map(v => `${v.label}: ${v.id === 'bp' ? `${v.sys}/${v.dia}` : v.value}${v.unit} (${v.status})`).join(', ');
  const medsStr = medications.length 
    ? medications.map(m => `${m.brandName} (${m.dosage})`).join(', ')
    : 'None active';

  // Construct context string to inject safely
  const systemContext = `You are a medical intelligence AI inside the Sanjivani OS app. Answer the user's questions clearly in simple, human-readable language (no complex jargon without explaining it).
You have medicinal knowledge but you must NOT legally diagnose or prescribe. 
Take into account the user's live profile, vitals, and medications to contextually anchor your answer.

USER CONTEXT:
Age: ${age}
Chronic Conditions: ${conditions}
Active Medications: ${medsStr}
Live Vitals (Very Important): ${vitalsStr}

If a vital is 'critical', strongly suggest seeing a doctor or routing to emergency.
Keep answers concise (max 3-4 sentences unless requiring instruction). Use a warm, professional tone.`;

  const contents = [
    { role: 'user', parts: [{ text: systemContext }] },
    { role: 'model', parts: [{ text: "Understood. I have securely processed the user's context. I am ready to answer their health queries." }] },
  ];

  history.forEach(msg => {
    contents.push({
      role: msg.role,
      parts: [{ text: msg.content }]
    });
  });

  contents.push({
    role: 'user',
    parts: [{ text: question }]
  });

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ contents })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error("Gemini vitals chat failed:", error);
    return "I am currently unable to reach the synthesis server. Please try again in a moment.";
  }
}
