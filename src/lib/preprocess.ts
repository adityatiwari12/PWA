// Declare the globally injected cv object from docs.opencv.org CDN
declare const cv: any;

export async function preprocessImage(dataUrl: string): Promise<string> {
  // If OpenCV is not loaded or initialization failed, bypass safely
  if (typeof cv === 'undefined' || !cv.Mat) {
    console.warn("OpenCV not yet loaded, bypassing preprocessing.");
    return dataUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Process with OpenCV
        const src = cv.imread(canvas);
        const gray = new cv.Mat();
        
        // Convert to grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // Apply thresholding to binarize image for Tesseract
        // Adjust threshold block size & C based on test cases (adaptive preferred for OCR)
        const thresh = new cv.Mat();
        cv.adaptiveThreshold(
           gray, 
           thresh, 
           255, 
           cv.ADAPTIVE_THRESH_GAUSSIAN_C, 
           cv.THRESH_BINARY, 
           11, 
           2
        );

        // Render back to canvas
        cv.imshow(canvas, thresh);

        // Cleanup wasm memory
        src.delete();
        gray.delete();
        thresh.delete();

        // Resolve new processed blob string
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error("OpenCV processing error:", err);
        resolve(dataUrl); // Fallback to raw on failure
      }
    };
    
    img.onerror = (err) => {
      console.error("Failed to load image for preprocessing:", err);
      reject(err);
    };

    img.src = dataUrl;
  });
}
