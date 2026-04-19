/**
 * vision.ts
 *
 * Unified Cloud Vision Extraction Layer.
 * Supports Groq Llama 3.2 Vision (Step 1: OCR) + Groq Llama text (Step 2: NER)
 * and Gemini 1.5 Flash Vision as a single-step fallback.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// ============================================================================
// PROMPTS
// ============================================================================

/** Step 2: NER prompt — sent to a fast text-only model with raw OCR text */
const NER_PROMPT = `You are a pharmaceutical NER specialist. Extract from the following medicine label text:

OUTPUT FORMAT (plain text, exactly as shown — no JSON, no extra text, no markdown):
Drug: <generic chemical name with pharmacopoeia code e.g. "Paracetamol BP">
Dosage: <number and unit e.g. "500 mg">
Expiry: <MM/YYYY or "Not found">

RULES:
- Drug = the CHEMICAL/GENERIC name (after IP/BP/USP/EP), NOT the brand name or tablet form
- IGNORE: brand names, "Tablet", "Capsule", "Uncoated", "Film-coated", manufacturer names
- If a field is missing, write "Not found"
- Output ONLY the 3 lines above — no explanation

LABEL TEXT:
`;

/** Gemini single-step vision + NER prompt */
const GEMINI_VISION_PROMPT = `You are a pharmaceutical NER specialist analyzing a medicine label image.

OUTPUT FORMAT (plain text, exactly as shown — no JSON, no extra text, no markdown):
Drug: <generic chemical name with pharmacopoeia code e.g. "Paracetamol BP">
Dosage: <number and unit e.g. "500 mg">
Expiry: <MM/YYYY or "Not found">

RULES:
- Drug = the CHEMICAL/GENERIC name (after IP/BP/USP/EP), NOT the brand name or tablet form
- IGNORE: brand names, "Tablet", "Capsule", "Uncoated", "Film-coated", manufacturer names
- If a field is missing, write "Not found"
- Output ONLY the 3 lines above — no explanation`;

// ============================================================================
// TYPES
// ============================================================================

export interface VisionResult {
  drug: string;
  dosage: string | null;
  expiry: string | null;
  manufacturer: string | null;
  rawText: string;
}

// ============================================================================
// PARSER — plain text "Drug: X / Dosage: Y / Expiry: Z" format
// ============================================================================

function parsePlainTextResponse(content: string): Omit<VisionResult, 'manufacturer'> {
  // Strip markdown artifacts LLMs sometimes insert
  const cleaned = content.replace(/[*_`#>]/g, '').trim();
  const lines = cleaned.split('\n');

  const extract = (prefix: string): string | null => {
    const line = lines.find(l => l.trim().toLowerCase().startsWith(prefix.toLowerCase()));
    if (!line) return null;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return null;
    const value = line.substring(colonIdx + 1).trim();
    const nullValues = ['not found', 'null', 'n/a', 'none', '-', ''];
    if (nullValues.includes(value.toLowerCase())) return null;
    return value;
  };

  return {
    drug: extract('drug:') || 'Unknown',
    dosage: extract('dosage:'),
    expiry: extract('expiry:'),
    rawText: content,
  };
}

// ============================================================================
// STEP 1: Groq Vision — extract raw text from image (no format enforcement)
// ============================================================================

async function getRawTextFromGroqVision(base64Image: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Read and transcribe ALL text visible on this medicine label. Output only the raw text, exactly as it appears, line by line.'
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}` }
            }
          ]
        }
      ],
      temperature: 0.0,
    })
  });

  if (!response.ok) throw new Error(`Groq Vision HTTP ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ============================================================================
// STEP 2: Groq Text NER — structure raw text into Drug/Dosage/Expiry
// ============================================================================

async function structureWithGroqText(rawText: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',   // fast text model, great at following format
      messages: [
        {
          role: 'system',
          content: NER_PROMPT
        },
        {
          role: 'user',
          content: rawText
        }
      ],
      temperature: 0.0,
    })
  });

  if (!response.ok) throw new Error(`Groq Text HTTP ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ============================================================================
// PUBLIC: Tier 1 — Groq Two-step (Vision OCR → Text NER)
// ============================================================================

export async function extractWithGroq(base64Image: string): Promise<VisionResult | null> {
  if (!GROQ_API_KEY) return null;

  try {
    console.log('[Vision] Groq Step 1: Vision OCR...');
    const rawOcr = await getRawTextFromGroqVision(base64Image);
    console.log('[Vision] Groq raw OCR:', rawOcr.substring(0, 120));

    console.log('[Vision] Groq Step 2: Text NER...');
    const nerResponse = await structureWithGroqText(rawOcr);
    console.log('[Vision] Groq NER response:', nerResponse);

    const parsed = parsePlainTextResponse(nerResponse);
    // Store both the raw OCR and the structured response in rawText for the debug panel
    return {
      ...parsed,
      rawText: `=== Raw OCR ===\n${rawOcr}\n\n=== Structured NER ===\n${nerResponse}`,
      manufacturer: null
    };
  } catch (err) {
    console.error('[Vision] Groq extraction failed:', err);
    return null;
  }
}

// ============================================================================
// PUBLIC: Tier 2 — Gemini 1.5 Flash Vision (single step, more reliable)
// ============================================================================

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
              { text: GEMINI_VISION_PROMPT },
            ],
          }],
          generationConfig: { temperature: 0.0 },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);

    const data = await response.json();
    const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    console.log('[Vision] Gemini response:', content);

    const parsed = parsePlainTextResponse(content);
    return { ...parsed, manufacturer: null };
  } catch (err) {
    console.error('[Vision] Gemini extraction failed:', err);
    return null;
  }
}
