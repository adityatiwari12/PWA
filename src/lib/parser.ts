/**
 * parser.ts
 *
 * Resilience-First Medical Entity Extraction Pipeline.
 *
 * Tier 1: Gemini 2.0 Flash Vision  — Cloud-based combined OCR + NER (best accuracy, but heavily rate-limited)
 * Tier 2: OCR.Space + Regex        — Fast, free cloud OCR without strict quotas + our regex parser
 * Tier 3: Offline Tesseract        — Purely on-device OCR (heavy, last resort)
 */

import { normalizeDrug } from './rxnorm';
import Tesseract from 'tesseract.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedMedication {
  drug: string;
  genericName: string;
  rxcui: string;
  dosage: string | null;
  expiry: string | null;
  manufacturer: string | null;
  rawText: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// ---------------------------------------------------------------------------
// Drug dictionary for local regex
// ---------------------------------------------------------------------------

const DRUG_DICTIONARY = [
  "Paracetamol", "Ibuprofen", "Aspirin", "Amoxicillin",
  "Cetirizine", "Omeprazole", "Lisinopril", "Metformin",
  "Levothyroxine", "Atorvastatin", "Amlodipine", "Albuterol",
  "Gabapentin", "Losartan", "Sertraline", "Warfarin",
  "Tylenol", "Advil", "Zyrtec", "Claritin",
  "Dolo", "Crocin", "Azithromycin", "Pantoprazole",
  "Montelukast", "Rosuvastatin", "Telmisartan", "Ciprofloxacin",
  "Diclofenac", "Ranitidine", "Domperidone", "Levocetirizine",
  "Calpol", "Combiflam", "Saridon", "Disprin", "Voveran",
  "Ecosprin", "Shelcal", "Becosules", "Limcee", "Sinarest",
  "Augmentin", "Zifi", "Ofloxacin", "Norfloxacin",
  "Metoprolol", "Amlokind", "Telma", "Stamlo",
];

function parseDataUrl(dataUrl: string): { mime: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (match) {
    return { mime: match[1], base64: match[2] };
  }
  return { mime: 'image/jpeg', base64: dataUrl.split(',')[1] || dataUrl };
}

// ---------------------------------------------------------------------------
// TIER 1: Gemini Vision (Cloud)
// ---------------------------------------------------------------------------

const EXTRACTION_PROMPT = `You are a clinical pharmacology AI analyzing a medicine image.
READ every piece of text visible in the image. EXTRACT these fields:
- "drug": PRIMARY brand/drug name.
- "dosage": Strength with unit.
- "expiry": Expiry date.
- "manufacturer": Pharmaceutical company name.

RULES:
1. Return ONLY a raw JSON object: {"drug":"...","dosage":"...","expiry":"...","manufacturer":"..."}
2. Set null for any field you cannot clearly read. Do NOT hallucinate.`;

async function extractWithGemini(imageDataUrl: string): Promise<ParsedMedication> {
  if (!GEMINI_API_KEY) throw new Error('No API key');

  const { mime, base64 } = parseDataUrl(imageDataUrl);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mime, data: base64 } },
            { text: EXTRACTION_PROMPT },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
    }
  );

  if (!response.ok) throw new Error(`API error ${response.status}`);
  
  const data = await response.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const jsonStr = rawContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(jsonStr);
  const drugName = parsed.drug || 'Unknown';
  const rxResult = await normalizeDrug(drugName);

  return {
    drug: drugName,
    genericName: rxResult?.name || drugName,
    rxcui: rxResult?.rxcui || '',
    dosage: parsed.dosage || null,
    expiry: parsed.expiry || null,
    manufacturer: parsed.manufacturer || null,
    rawText: rawContent,
  };
}

// ---------------------------------------------------------------------------
// TIER 2 & 3: Regex Extraction Engine
// ---------------------------------------------------------------------------

export async function fallbackRegexParser(text: string): Promise<ParsedMedication> {
  const normalizedText = text.replace(/\n/g, ' ').trim();

  let detectedDrug = "";
  // 1. Dictionary Match
  for (const drug of DRUG_DICTIONARY) {
    if (new RegExp(`\\b${drug}\\b`, 'i').test(normalizedText)) {
      detectedDrug = drug;
      break;
    }
  }

  // 2. Heuristic Match: Find capitalized words not in exclusion list
  if (!detectedDrug) {
    const tokens = normalizedText.split(/\s+/);
    for (const token of tokens) {
      if (/^[a-zA-Z]{5,}$/.test(token)) {
        const skip = ['tablets', 'capsules', 'syrup', 'keep', 'reach', 'children', 'store', 'below', 'mfg', 'ltd'];
        if (!skip.includes(token.toLowerCase())) {
          detectedDrug = token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
          break;
        }
      }
    }
  }

  // 3. Regex extractions
  const dosageMatch = normalizedText.match(/\b\d+(\.\d+)?\s?(mg|ml|g|mcg|iu|meq|%)\b/i);
  const expiryMatch = normalizedText.match(/(?:exp|expiry|use by|before)?[^\d]*(0[1-9]|1[0-2])[-/](\d{2,4})\b/i);
  const formattedExpiry = expiryMatch ? `${expiryMatch[1]}/${expiryMatch[2]}` : null;
  const mfgMatch = normalizedText.match(/(?:mfg\.?|manufactured)\s*(?:by\s*)?[:\s]*([A-Z][A-Za-z\s&.]+(?:Ltd|Pvt|Inc|Corp|Pharma|Labs?)?\.?)/i);

  const drugName = detectedDrug || 'Unknown';
  const rxResult = await normalizeDrug(drugName);

  return {
    drug: drugName,
    genericName: rxResult?.name || drugName,
    rxcui: rxResult?.rxcui || '',
    dosage: dosageMatch ? dosageMatch[0].toLowerCase() : null,
    expiry: formattedExpiry,
    manufacturer: mfgMatch ? mfgMatch[1] : null,
    rawText: text,
  };
}

// ---------------------------------------------------------------------------
// TIER 2: Free Cloud OCR (api.ocr.space)
// ---------------------------------------------------------------------------

async function runFreeCloudOCR(imageDataUrl: string): Promise<string> {
  console.log('[parser] 🟡 Tier 2: Running Free Cloud OCR (OCR.space)...');
  try {
    const formData = new FormData();
    formData.append('base64image', imageDataUrl);
    formData.append('language', 'eng');
    formData.append('apikey', 'helloworld'); // Free public tier
    formData.append('isOverlayRequired', 'false');
    
    // OCR.Space requires base64 content type to be strictly defined
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(`OCR.space returned ${response.status}`);
    
    const data = await response.json();
    if (data.IsErroredOnProcessing || !data.ParsedResults?.length) {
      throw new Error('OCR.space failed to parse');
    }

    const text = data.ParsedResults[0].ParsedText || '';
    console.log('[parser] OCR.space extracted:', text.length, 'chars');
    return text;
  } catch (err) {
    console.error('[parser] Free Cloud OCR failed:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// TIER 3: Local Offline OCR (Tesseract)
// ---------------------------------------------------------------------------

async function runLocalOCR(imageDataUrl: string, onOCRProgress?: (p: number) => void): Promise<string> {
  console.log('[parser] 🔴 Tier 3: Running local Tesseract OCR...');
  try {
    const result = await Tesseract.recognize(imageDataUrl, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text' && onOCRProgress) {
          onOCRProgress(Math.round(m.progress * 100));
        }
      }
    });
    console.log('[parser] Local OCR extracted:', result.data.text.length, 'chars');
    return result.data.text;
  } catch(e) {
    console.error('[parser] Local OCR failed:', e);
    return '';
  }
}

// ---------------------------------------------------------------------------
// PUBLIC: Main orchestrator
// ---------------------------------------------------------------------------

export async function extractMedicalEntitiesVision(
  imageDataUrl: string,
  onOCRProgress?: (p: number) => void
): Promise<ParsedMedication> {

  // Tier 1: Gemini Vision
  try {
    const result = await extractWithGemini(imageDataUrl);
    if (result.drug && result.drug !== 'Unknown') return result;
    console.warn('[parser] Gemini returned Unknown drug. Trying Tier 2...');
  } catch (err) {
    console.error('[parser] Gemini failed or ratelimited (429). Falling back to Tier 2.');
  }

  // Tier 2: Free Cloud OCR
  try {
    const ocrText = await runFreeCloudOCR(imageDataUrl);
    const result = await fallbackRegexParser(ocrText);
    if (result.drug && result.drug !== 'Unknown') return result;
    console.warn('[parser] Free cloud OCR returned Unknown drug. Trying Tier 3...');
  } catch (err) {
    console.error('[parser] Tier 2 Free Cloud OCR failed. Falling back to Tier 3.');
  }

  // Tier 3: Local OCR + Regex (100% Offline fallback)
  const localText = await runLocalOCR(imageDataUrl, onOCRProgress);
  return fallbackRegexParser(localText);
}
