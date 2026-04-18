from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import torch
from transformers import AutoTokenizer, pipeline
from PIL import Image, ImageOps, ImageEnhance
import io
import numpy as np
import os
import time

app = FastAPI()

# Enable CORS for PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Models
FORCE_CPU = os.getenv("FORCE_CPU", "false").lower() == "true"
device = "cuda" if torch.cuda.is_available() and not FORCE_CPU else "cpu"

print(f"--- Initialization ---")
print(f"Device: {device}")

print("Loading EasyOCR Reader...")
reader = easyocr.Reader(['en'], gpu=(device == "cuda"))

print("Loading PubMedBERT NER Pipeline...")
model_id = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract"
try:
    ner_pipeline = pipeline("ner", model="sammdot/pubmedbert-base-uncased-ner-fine-tuned", aggregation_strategy="simple", device=0 if device == "cuda" else -1)
except Exception as e:
    ner_pipeline = pipeline("ner", model=model_id, aggregation_strategy="simple", device=0 if device == "cuda" else -1)

def enhance_image(image: Image.Image, level=1.0):
    """Image enhancement suite."""
    if level == 1.1: # High Contrast
        image = ImageOps.grayscale(image)
        image = ImageEnhance.Contrast(image).enhance(2.5)
        image = ImageEnhance.Sharpness(image).enhance(2.0)
    elif level == 1.2: # Brightened
        image = ImageEnhance.Brightness(image).enhance(1.5)
        image = ImageEnhance.Contrast(image).enhance(1.5)
    return image

@app.post("/extract")
async def extract_medication(file: UploadFile = File(...)):
    start_time = time.time()
    print(f"\n[SCAN REQUEST] Processing: {file.filename}")
    
    try:
        contents = await file.read()
        img_original = Image.open(io.BytesIO(contents)).convert('RGB')
        
        all_text_blocks = []
        
        # Multi-stage OCR logic
        stages = [
            {"name": "Default", "img": img_original},
            {"name": "High Contrast", "img": enhance_image(img_original, 1.1)},
            {"name": "Brightened", "img": enhance_image(img_original, 1.2)}
        ]

        for stage in stages:
            print(f"Running OCR Stage: {stage['name']}...")
            try:
                # Use paragraph=False first to get detailed word positions if needed, 
                # but paragraph=True is more robust for merging.
                res = reader.readtext(np.array(stage['img']), detail=0, paragraph=True)
                if res:
                    all_text_blocks.extend(res)
                    # If we found significant text, we can stop or continue for perfection.
                    if len(" ".join(res)) > 100: break 
            except Exception as e:
                print(f"Stage {stage['name']} failed: {e}")

        # Post-Processing
        full_raw_text = " ".join(list(dict.fromkeys(all_text_blocks))).strip()
        print(f"OCR Complete. Yielded {len(full_raw_text)} chars.")
        print(f"--- RAW TEXT START ---\n{full_raw_text}\n--- RAW TEXT END ---")

        if not full_raw_text:
            return {"drug": "Unknown", "dosage": None, "expiry": None, "manufacturer": None, "rawText": ""}

        # NER Extraction
        print("Running NER Analysis...")
        entities = ner_pipeline(full_raw_text[:512]) # Limit to first 512 for speed/limits
        
        extracted = {
            "drug": "Unknown",
            "dosage": None,
            "expiry": None,
            "manufacturer": None,
            "rawText": full_raw_text
        }
        
        for ent in entities:
            label = ent['entity_group'].lower()
            word = ent['word'].strip()
            if len(word) < 2: continue
            
            if label in ['medication', 'chemical', 'drug'] and extracted["drug"] == "Unknown":
                extracted["drug"] = word
            elif label in ['dosage', 'strength']:
                extracted["dosage"] = word
            elif label in ['manufacturer', 'organization']:
                extracted["manufacturer"] = word

        print(f"Scan Finished in {time.time() - start_time:.2f}s")
        return extracted

    except Exception as e:
        print(f"SCAN FAILED: {str(e)}")
        raise HTTPException(status_code=500, detail="OCR processing error")

@app.get("/health")
async def health():
    return {"status": "ready", "device": device}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
