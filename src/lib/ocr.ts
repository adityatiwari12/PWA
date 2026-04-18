/**
 * ocr.ts
 *
 * @deprecated — Tesseract.js OCR has been replaced by the Vision-first pipeline.
 * This file is retained as a stub so any stale imports compile without error.
 * The actual text extraction is now performed by the Groq LLaMA 3.2 Vision model
 * in parser.ts → extractMedicalEntitiesVision().
 */

/**
 * @deprecated Use extractMedicalEntitiesVision() from parser.ts instead.
 */
export async function runOCR(
  _imageSource: string | HTMLCanvasElement | HTMLImageElement | HTMLVideoElement,
  _onProgress?: (progress: number) => void
): Promise<string> {
  console.warn('[ocr.ts] runOCR is deprecated. The Vision pipeline handles extraction directly.');
  return '';
}
