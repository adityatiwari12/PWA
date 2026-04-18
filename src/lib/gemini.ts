import type { UserProfile } from '../types/user';
import type { CyclePhase } from '../hooks/useCycleState';

const GEMINI_API_KEY = "AIzaSyBFcXSfyvVgqJFdFg4W-d53zZFSyRVQGVs";

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
