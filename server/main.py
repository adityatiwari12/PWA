from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import easyocr
import torch
from transformers import AutoTokenizer, pipeline
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import io
import numpy as np
import os
import time
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from root .env
load_dotenv(dotenv_path="../.env")
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY")

app = FastAPI()

# Enable CORS for PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# SYSTEM PROMPT CONFIGURATION
# ---------------------------------------------------------------------------
SYSTEM_INSTRUCTION = """
You are a Senior Clinical Pharmacist and Medical Data Auditor. 
Your specialty is extracting structured information from high-noise OCR text on medicine strips.

LOGIC PROTOCOL:
1. IDENTIFY BRAND: Search for the most prominent brand name (e.g., Pantocid, Dolo, Augmentin).
2. CORRECT OCR NOISE: You must intelligently map common OCR errors to real medical names.
   - "Paatocld" -> "Pantocid"
   - "Tegriz?" -> "Tegritol"
   - "Baffoprazoie" -> "Pantoprazole"
3. EXTRACT DOSAGE: Identify the strength per unit. Look for mg, mcg, ml, %, etc.
4. INDEPENDENT VERIFICATION: If you see "Pantoprazole" and a mangled word like "Paatocld," you know it is "Pantocid."
5. MANUFACTURE: Identify the pharmaceutical company (Novartis, Sun Pharma, Cipla, etc.).
6. EXPIRY: Extract date as MM/YYYY.

FEW-SHOT EXAMPLES:
---
INPUT: "Paatocld DSR | pautocid DSR | Enteric-Coated Baffoprazoie Sodium 40mg | Sustained Domperidone 30mg"
OUTPUT: {"drug": "Pantocid DSR", "dosage": "40mg / 30mg", "expiry": null, "manufacturer": null}
---
INPUT: "ne TabletsIF Tegritard 200 | NOVARTIS | Carbamazepine 200mg"
OUTPUT: {"drug": "Tegritol 200", "dosage": "200mg", "expiry": null, "manufacturer": "Novartis"}
---

Respond ONLY with a valid JSON object. Do not explain. Do not hallucinate.
"""

# Initialize Gemini
if GEMINI_API_KEY:
    print("--- [BOOT] Gemini AI Engine Active ---")
    genai.configure(api_key=GEMINI_API_KEY)
    # Using System Instruction for higher accuracy (Gemini 1.5+)
    llm_model = genai.GenerativeModel(
        model_name='gemini-1.5-flash',
        system_instruction=SYSTEM_INSTRUCTION
    )
else:
    print("--- [BOOT] WARNING: Gemini Key Missing. Falling back to local NER only. ---")
    llm_model = None

# Initialize OCR Models
FORCE_CPU = os.getenv("FORCE_CPU", "false").lower() == "true"
device = "cuda" if torch.cuda.is_available() and not FORCE_CPU else "cpu"

print(f"--- [BOOT] True Waterfall Engine ---")
print(f"Device Acceleration: {device.upper()}")

print("Loading OCR Engine (EasyOCR)...")
reader = easyocr.Reader(['en'], gpu=(device == "cuda"))

print("Loading Clinical NER Fallback (PubMedBERT)...")
model_id = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract"
try:
    ner_pipeline = pipeline("ner", model="sammdot/pubmedbert-base-uncased-ner-fine-tuned", aggregation_strategy="simple", device=0 if device == "cuda" else -1)
except Exception as e:
    print(f"Notice: Specialized NER fallback active.")
    ner_pipeline = pipeline("ner", model=model_id, aggregation_strategy="simple", device=0 if device == "cuda" else -1)

def heavy_preprocess(image: Image.Image, mode="default"):
    """Deep image pre-processing for difficult OCR cases."""
    if mode == "high_contrast":
        image = ImageOps.grayscale(image)
        image = ImageEnhance.Contrast(image).enhance(3.5)
        image = ImageEnhance.Sharpness(image).enhance(3.0)
    elif mode == "dilated":
        image = ImageOps.grayscale(image)
        image = image.filter(ImageFilter.MaxFilter(3)) # Slight dilation
        image = ImageEnhance.Contrast(image).enhance(2.0)
    return image

async def refine_with_gemini(raw_text: str):
    """Uses Gemini to extract structured medical data from raw OCR."""
    if not llm_model:
        return None
        
    try:
        # Prompt is now very short because logic is in system_instruction
        response = llm_model.generate_content(f"EXTRACT DATA FROM THIS TEXT:\n{raw_text}")
        text_response = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text_response)
    except Exception as e:
        print(f"  ! Gemini Refinement Failed: {e}")
        return None

@app.post("/api/extract")
async def extract_medication(file: UploadFile = File(...)):
    start_time = time.time()
    print(f"\n[WATERFALL START] Processing Image: {file.filename}")
    
    try:
        contents = await file.read()
        img_original = Image.open(io.BytesIO(contents)).convert('RGB')
        
        all_text_results = []
        rotations = [0, 90, 180, 270]
        enhancements = ["default", "high_contrast"]

        for angle in rotations:
            rotated_img = img_original.rotate(angle, expand=True)
            for enh in enhancements:
                pass_name = f"Angle {angle}° | {enh}"
                print(f"  > Pass: {pass_name}")
                processed = heavy_preprocess(rotated_img, enh)
                try:
                    res = reader.readtext(np.array(processed), detail=0, paragraph=True)
                    if res:
                        clean = [r.strip() for r in res if len(r.strip()) > 2]
                        all_text_results.extend(clean)
                except Exception as pass_err:
                    print(f"  ! Pass Failed: {pass_err}")

        full_raw_text = " | ".join(list(dict.fromkeys(all_text_results))).strip()
        print(f"\n--- [OCR RESULT] Found {len(full_raw_text)} chars in {time.time() - start_time:.2f}s ---")

        # STAGE 2: Refinement
        extracted = {
            "drug": "Unknown", "dosage": None, "expiry": None, 
            "manufacturer": None, "rawText": full_raw_text, "status": "success"
        }

        # Priority 1: Gemini (Server-side)
        if llm_model:
            print("  > Running Optimized Gemini Refinement...")
            gemini_res = await refine_with_gemini(full_raw_text)
            if gemini_res:
                extracted.update(gemini_res)
                print(f"  > Gemini Success: {extracted['drug']}")
                return extracted

        # Priority 2: Local NER Fallback
        print("  > Falling back to Local NER Analysis...")
        entities = ner_pipeline(full_raw_text[:512])
        for ent in entities:
            label = ent['entity_group'].lower()
            word = ent['word'].strip()
            if len(word) < 3: continue
            if label in ['medication', 'drug'] and extracted["drug"] == "Unknown":
                extracted["drug"] = word
            elif label in ['dosage', 'strength']:
                extracted["dosage"] = word
            elif label in ['manufacturer', 'organization']:
                extracted["manufacturer"] = word

        print(f"[WATERFALL COMPLETE] Total Time: {time.time() - start_time:.2f}s")
        return extracted

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Local pipeline engine failure")

@app.get("/api/health")
async def health():
    return {"status": "ready", "device": device, "gemini_active": llm_model is not None}

# Mount static files and SPA Catch-all
import os

frontend_dist = os.path.join(os.path.dirname(__file__), "..", "dist")

if os.path.isdir(frontend_dist):
    # Serve static assets
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    # Optional: Serve other root files if needed (manifest.json, etc.)
    # We will use a catch-all for everything else

    @app.get("/{full_path:path}")
    async def serve_pwa(full_path: str):
        # Allow requests to /api to pass through to the actual API, shouldn't hit here due to routing order, but just in case
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        # Serve specific requested files if they exist (like manifest.webmanifest, favicon)
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Default to index.html for SPA routing
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_path):
             return FileResponse(index_path)
        return {"error": "Frontend build not found. Run npm run build."}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
