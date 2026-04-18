/**
 * pillScanner.ts
 *
 * Unified medicine-strip scanning pipeline v3 — Multi-tier Vision Architecture.
 *
 * Pipeline stages:
 *   1. Image preprocessing  (Grayscale → CLAHE → Sharpen → Bilateral → Morph → Upscale → Compress)
 *   2. Vision extraction     (Gemini → Groq → Offline regex)
 *   3. Confidence scoring
 */

// Declare the globally injected cv object from the OpenCV CDN
declare const cv: any;

import { extractMedicalEntitiesVision, type ParsedMedication } from './parser';
import { scoreConfidence, type ConfidenceResult } from './ocrCleaner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScanResult {
  processedImageUrl: string;
  rawOcrText: string;
  cleanedOcrText: string;
  medication: ParsedMedication;
  confidence: ConfidenceResult;
}

export interface ScanProgressEvent {
  stage: 'preprocessing' | 'analyzing' | 'extracting' | 'done';
  detail?: string;
}

// ---------------------------------------------------------------------------
// 1. Image Preprocessing — OpenCV pipeline
// ---------------------------------------------------------------------------

/** CLAHE contrast enhancement */
function applyClahe(grayMat: any): any {
  try {
    const clahe = cv.createCLAHE(3.0, new cv.Size(8, 8));
    const dst = new cv.Mat();
    clahe.apply(grayMat, dst);
    clahe.delete();
    return dst;
  } catch {
    return grayMat.clone();
  }
}

/** Unsharp masking — sharpens text edges */
function applyUnsharpMask(src: any): any {
  try {
    const blurred = new cv.Mat();
    cv.GaussianBlur(src, blurred, new cv.Size(0, 0), 3);
    const sharpened = new cv.Mat();
    cv.addWeighted(src, 1.5, blurred, -0.5, 0, sharpened);
    blurred.delete();
    return sharpened;
  } catch {
    return src.clone();
  }
}

/** Bilateral filter — denoise while preserving edges */
function applyBilateralDenoise(src: any): any {
  try {
    const dst = new cv.Mat();
    cv.bilateralFilter(src, dst, 9, 75, 75, cv.BORDER_DEFAULT);
    return dst;
  } catch {
    // fallback to gaussian
    const dst = new cv.Mat();
    cv.GaussianBlur(src, dst, new cv.Size(3, 3), 1, 1, cv.BORDER_DEFAULT);
    return dst;
  }
}

/** Morphological cleanup — close tiny gaps in letterforms */
function applyMorphCleanup(src: any): any {
  try {
    const dst = new cv.Mat();
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    cv.morphologyEx(src, dst, cv.MORPH_CLOSE, kernel);
    kernel.delete();
    return dst;
  } catch {
    return src.clone();
  }
}

/**
 * Full OpenCV pipeline:
 * RGBA → Grayscale → CLAHE → Sharpen → Bilateral Denoise → Morph Cleanup
 */
function preprocessWithOpenCV(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const src = cv.imread(sourceCanvas);
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  src.delete();

  const contrasted = applyClahe(gray);
  gray.delete();

  const sharpened = applyUnsharpMask(contrasted);
  contrasted.delete();

  const denoised = applyBilateralDenoise(sharpened);
  sharpened.delete();

  const cleaned = applyMorphCleanup(denoised);
  denoised.delete();

  const outCanvas = document.createElement('canvas');
  outCanvas.width = sourceCanvas.width;
  outCanvas.height = sourceCanvas.height;
  cv.imshow(outCanvas, cleaned);
  cleaned.delete();

  return outCanvas;
}

/**
 * Preprocess + compress image for Vision APIs.
 * Returns a JPEG data URL under 3MB.
 */
export async function preprocessForVision(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        console.log('[pillScanner] Input image:', img.width, 'x', img.height);

        // Draw source onto canvas
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = img.width;
        srcCanvas.height = img.height;
        const ctx = srcCanvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0);

        // Attempt OpenCV preprocessing
        let processedCanvas: HTMLCanvasElement;
        if (typeof cv !== 'undefined' && cv.Mat) {
          console.log('[pillScanner] Running OpenCV pipeline...');
          processedCanvas = preprocessWithOpenCV(srcCanvas);
        } else {
          console.warn('[pillScanner] OpenCV not available, using raw image');
          processedCanvas = srcCanvas;
        }

        // Upscale if too small (Vision models need at least ~800px)
        if (processedCanvas.width < 800) {
          const scale = 800 / processedCanvas.width;
          const upscaled = document.createElement('canvas');
          upscaled.width = Math.round(processedCanvas.width * scale);
          upscaled.height = Math.round(processedCanvas.height * scale);
          const uctx = upscaled.getContext('2d');
          if (uctx) {
            uctx.imageSmoothingEnabled = true;
            uctx.imageSmoothingQuality = 'high';
            uctx.drawImage(processedCanvas, 0, 0, upscaled.width, upscaled.height);
            processedCanvas = upscaled;
          }
        }

        // Downscale if too large (keep under 2000px longest edge for API limits)
        const maxDim = 2000;
        if (processedCanvas.width > maxDim || processedCanvas.height > maxDim) {
          const scale = Math.min(maxDim / processedCanvas.width, maxDim / processedCanvas.height);
          const downscaled = document.createElement('canvas');
          downscaled.width = Math.round(processedCanvas.width * scale);
          downscaled.height = Math.round(processedCanvas.height * scale);
          const dctx = downscaled.getContext('2d');
          if (dctx) {
            dctx.drawImage(processedCanvas, 0, 0, downscaled.width, downscaled.height);
            processedCanvas = downscaled;
          }
        }

        // Export as JPEG (much smaller than PNG, critical for API payload limits)
        let result = processedCanvas.toDataURL('image/jpeg', 0.85);

        // Safety check: if still over 3MB, reduce quality
        const sizeKB = Math.round((result.length * 0.75) / 1024);
        console.log('[pillScanner] Output image:', processedCanvas.width, 'x',
          processedCanvas.height, '~', sizeKB, 'KB');

        if (sizeKB > 3000) {
          console.warn('[pillScanner] Image still too large, reducing quality...');
          result = processedCanvas.toDataURL('image/jpeg', 0.60);
          const newSizeKB = Math.round((result.length * 0.75) / 1024);
          console.log('[pillScanner] Compressed to ~', newSizeKB, 'KB');
        }

        resolve(result);
      } catch (err) {
        console.error('[pillScanner] Preprocessing error:', err);
        // Fallback: convert raw image to compressed JPEG without OpenCV
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = img.width;
        fallbackCanvas.height = img.height;
        const fctx = fallbackCanvas.getContext('2d');
        if (fctx) {
          fctx.drawImage(img, 0, 0);
          resolve(fallbackCanvas.toDataURL('image/jpeg', 0.80));
        } else {
          resolve(dataUrl);
        }
      }
    };

    img.onerror = () => {
      console.error('[pillScanner] Failed to load image.');
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

// ---------------------------------------------------------------------------
// 2. Full scan pipeline
// ---------------------------------------------------------------------------

/**
 * v3 Pipeline:
 *   1. OpenCV preprocessing + compress to JPEG
 *   2. Multi-tier extraction (Gemini → Groq → Offline regex)
 *   3. Confidence scoring
 */
export async function scanPill(
  dataUrl: string,
  onProgress?: (evt: ScanProgressEvent) => void,
): Promise<ScanResult> {

  // Stage 1: Preprocessing
  onProgress?.({ stage: 'preprocessing', detail: 'Enhancing image…' });
  const processedImageUrl = await preprocessForVision(dataUrl);

  // Stage 2: Multi-tier extraction with local OCR fallback progress
  onProgress?.({ stage: 'analyzing', detail: 'Analyzing with Vision AI or Local OCR…' });
  const medication = await extractMedicalEntitiesVision(processedImageUrl, (p) => {
    onProgress?.({ stage: 'analyzing', detail: `Local OCR Offline Extraction… ${p}%` });
  });

  // Stage 3: Confidence scoring
  onProgress?.({ stage: 'extracting', detail: 'Scoring confidence…' });
  const rawText = medication.rawText || '';
  const confidence = scoreConfidence(rawText, rawText, medication.drug, medication.dosage, medication.expiry);

  onProgress?.({ stage: 'done' });

  return {
    processedImageUrl,
    rawOcrText: rawText,
    cleanedOcrText: rawText,
    medication,
    confidence,
  };
}
