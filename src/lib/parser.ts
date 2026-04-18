/**
 * parser.ts
 *
 * Cloud-First Medical Entity Extraction Pipeline.
 * 
 * Optimized for Sanjivani Health OS (Minimal Footprint).
 *
 * Tier 1: Groq Llama 3.2 Vision  — Ultra-fast Llama-powered extraction.
 * Tier 2: Gemini 1.5 Flash Vision — Robust multi-modal fallback.
 * Tier 3: OCR.Space + Regex        — Lightweight cloud OCR fallback.
 */

import { normalizeDrug } from './rxnorm';
import { extractWithGroq, extractWithGemini } from './vision';

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
  sourceTier?: string;
}

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
// TIER 3: Free Cloud OCR (api.ocr.space)
// ---------------------------------------------------------------------------

async function runFreeCloudOCR(imageDataUrl: string): Promise<string> {
  console.log('[parser] 🟡 Tier 3: Running Free Cloud OCR (OCR.space)...');
  try {
    const formData = new FormData();
    formData.append('base64image', imageDataUrl);
    formData.append('language', 'eng');
    formData.append('apikey', 'helloworld'); 
    formData.append('isOverlayRequired', 'false');
    
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
    return text;
  } catch (err) {
    console.error('[parser] Free Cloud OCR failed:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Regex Parser Fallback
// ---------------------------------------------------------------------------

export async function fallbackRegexParser(text: string): Promise<ParsedMedication> {
  const normalizedText = text.replace(/\n/g, ' ').trim();

  let detectedDrug = "";
  for (const drug of DRUG_DICTIONARY) {
    if (new RegExp(`\\b${drug}\\b`, 'i').test(normalizedText)) {
      detectedDrug = drug;
      break;
    }
  }

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
    sourceTier: 'Tier 3: Regex Engine'
  };
}

// ---------------------------------------------------------------------------
// PUBLIC: Main orchestrator
// ---------------------------------------------------------------------------

export async function extractMedicalEntitiesVision(
  imageDataUrl: string,
  _onOCRProgress?: (p: number) => void
): Promise<ParsedMedication> {
  const { base64 } = parseDataUrl(imageDataUrl);

  // Tier 1: Groq Llama 3.2 Vision
  try {
    console.log('[Scanner] 🚀 Tier 1: Groq Llama Vision...');
    const result = await extractWithGroq(base64);
    if (result && result.drug !== 'Unknown') {
      const rxResult = await normalizeDrug(result.drug);
      return {
        ...result,
        drug: result.drug,
        genericName: rxResult?.name || result.drug,
        rxcui: rxResult?.rxcui || '',
        sourceTier: 'Tier 1: Groq Cloud Vision'
      };
    }
  } catch (err) {
    console.error('[Scanner] Groq Tier failed:', err);
  }

  // Tier 2: Gemini 1.5 Flash Vision
  try {
    console.log('[Scanner] ☁️ Tier 2: Gemini Flash Vision...');
    const result = await extractWithGemini(base64);
    if (result && result.drug !== 'Unknown') {
      const rxResult = await normalizeDrug(result.drug);
      return {
        ...result,
        drug: result.drug,
        genericName: rxResult?.name || result.drug,
        rxcui: rxResult?.rxcui || '',
        sourceTier: 'Tier 2: Gemini Cloud Vision'
      };
    }
  } catch (err) {
    console.error('[Scanner] Gemini Tier failed:', err);
  }

  // Tier 3: OCR.Space + Regex
  try {
    const ocrText = await runFreeCloudOCR(imageDataUrl);
    const result = await fallbackRegexParser(ocrText);
    if (result.drug && result.drug !== 'Unknown') return result;
  } catch (err) {
    console.error('[Scanner] Tier 3 Cloud OCR failed.');
  }

  // Final fallback (Return empty structure)
  return {
    drug: 'Unknown',
    genericName: 'Unknown',
    rxcui: '',
    dosage: null,
    expiry: null,
    manufacturer: null,
    rawText: '',
    sourceTier: 'Extraction Failed'
  };
}
