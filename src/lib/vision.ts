/**
 * vision.ts
 *
 * Unified Cloud Vision Extraction Layer.
 * Supports Groq Llama 3.2 Vision and Gemini 1.5 Flash Vision.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const EXTRACTION_PROMPT = `You are a clinical pharmacology AI.
EXTRACT THE FOLLOWING DATA FROM THE IMAGE:
- "drug": Brand name or generic if brand is missing. (Refined: e.g. "Dolo 650", not "D0lo")
- "dosage": Strength/concentration (e.g. 500mg/5ml, 650mg)
- "expiry": Date in MM/YYYY format.
- "manufacturer": Pharma company name.

STRICT RULES:
1. Identify common OCR artifacts and fix them (e.g., "Paatocld" -> "Pantocid").
2. REJECT words like "IP", "BP", "Tablets", "Capsules" as the drug name.
3. Return ONLY a valid JSON object: {"drug":"...","dosage":"...","expiry":"...","manufacturer":"..."}
4. Use null if data is unreadable.`;

export interface VisionResult {
  drug: string;
  dosage: string | null;
  expiry: string | null;
  manufacturer: string | null;
  rawText: string;
}

/**
 * Tier 1: Groq Llama 3.2 Vision
 * Fastest response time, excellent OCR capabilities.
 */
export async function extractWithGroq(base64Image: string): Promise<VisionResult | null> {
  if (!GROQ_API_KEY) return null;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              { 
                type: "image_url", 
                image_url: { url: `data:image/jpeg;base64,${base64Image}` } 
              }
            ]
          }
        ],
        temperature: 0.1,
      })
    });

    if (!response.ok) throw new Error('Groq API failure');
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      ...parsed,
      rawText: content
    };
  } catch (err) {
    console.error('[Vision] Groq extraction failed:', err);
    return null;
  }
}

/**
 * Tier 2: Gemini 1.5 Flash Vision
 * Most robust clinical reasoning.
 */
export async function extractWithGemini(base64Image: string, mimeType: string = 'image/jpeg'): Promise<VisionResult | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Image } },
              { text: EXTRACTION_PROMPT },
            ],
          }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    if (!response.ok) throw new Error('Gemini API failure');
    
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      ...parsed,
      rawText: content
    };
  } catch (err) {
    console.error('[Vision] Gemini extraction failed:', err);
    return null;
  }
}
