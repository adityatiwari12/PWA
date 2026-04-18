/**
 * ocrCleaner.ts
 *
 * Confidence scoring module for the Vision extraction pipeline.
 *
 * v2 Changes:
 *   - Removed all regex-based text cleaning rules (Vision model handles spelling)
 *   - Retained and improved confidence scoring heuristics
 *   - Scoring now evaluates Vision model output quality rather than raw OCR quality
 *
 * Zero dependencies – pure TypeScript.
 */

// ---------------------------------------------------------------------------
// Confidence scoring
//    Heuristics that estimate how trustworthy the extraction result is.
//    Returns 0–100; anything below CONFIDENCE_THRESHOLD should show the
//    manual correction UI.
// ---------------------------------------------------------------------------
export const CONFIDENCE_THRESHOLD = 55; // below this → show fallback UI

export interface ConfidenceResult {
  score: number;        // 0-100
  isLow: boolean;       // true when score < CONFIDENCE_THRESHOLD
  reasons: string[];    // human-readable explanation for debugging
}

/**
 * Score how confident we are in the Vision extraction result.
 *
 * @param rawText        Raw text from Vision model response
 * @param _cleanedText   Same as rawText in v2 (kept for interface compat)
 * @param drug           Extracted drug name (may be "Unknown")
 * @param dosage         Extracted dosage (may be null)
 * @param expiry         Extracted expiry (may be null)
 */
export function scoreConfidence(
  rawText: string,
  _cleanedText: string,
  drug: string,
  dosage: string | null,
  expiry: string | null,
): ConfidenceResult {
  let score = 100;
  const reasons: string[] = [];

  // --- Penalty: unknown drug ------------------------------------------------
  if (!drug || drug === 'Unknown') {
    score -= 40;
    reasons.push('Drug name not identified');
  }

  // --- Penalty: missing dosage & expiry together ----------------------------
  if (!dosage && !expiry) {
    score -= 25;
    reasons.push('Neither dosage nor expiry found');
  } else if (!dosage) {
    score -= 10;
    reasons.push('Dosage not found');
  } else if (!expiry) {
    score -= 10;
    reasons.push('Expiry not found');
  }
  
  // --- Penalty: Hallucinations & Known OCR errors ---------------------------
  const drugLower = (drug || '').toLowerCase();
  const blacklist = ['fahists', 'fahist', 'tablets', 'capsules', 'novartis', 'pfizer', 'glaxo', 'cipla', 'abbott'];
  
  if (blacklist.some(b => drugLower.includes(b))) {
    score = 10; // Forced failure
    reasons.push(`Detected likely hallucination or non-drug name: "${drug}"`);
  }

  // --- Penalty: very short raw text (Vision model couldn't read much) -------
  const wordCount = rawText.trim().split(/\s+/).filter(w => w.length > 1).length;
  if (wordCount < 4) {
    score -= 20;
    reasons.push('Very little text detected — image may be blurry or blank');
  } else if (wordCount < 8) {
    score -= 8;
    reasons.push('Low text content from image');
  }

  // --- Penalty: drug name looks like noise (only uppercase/digits, very short)
  if (drug && drug !== 'Unknown' && /^[A-Z0-9]+$/.test(drug) && drug.length < 4) {
    score -= 10;
    reasons.push('Drug name suspiciously short/capitalised — may be noise');
  }

  // --- Bonus: if all 3 fields extracted, boost slightly ----------------------
  if (drug && drug !== 'Unknown' && dosage && expiry) {
    score = Math.min(100, score + 5);
  }

  // Clamp [0, 100]
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    isLow: score < CONFIDENCE_THRESHOLD,
    reasons,
  };
}
