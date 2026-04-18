# --- Phase 1: Build the React PWA ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy generic package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the frontend source
COPY . .

# Build the frontend (Vite)
RUN npm run build

# --- Phase 2: Setup Python Backend & Serve ---
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies required by OpenCV and EasyOCR
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY server/requirements.txt ./
# For Render we want to ensure we don't install the full CUDA torch if we are running on CPU to save space/RAM
# Usually Render instances are CPU-only unless specifically configured.
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install -r requirements.txt

# Pre-download EasyOCR models (English) by running a simple python script
# This prevents timeouts during the first request
RUN python -c "import easyocr; easyocr.Reader(['en'], gpu=False)"

# Pre-download PubMedBERT model
RUN python -c "from transformers import pipeline; pipeline('ner', model='microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract', aggregation_strategy='simple', device=-1)"

# Copy the built frontend from Phase 1
COPY --from=frontend-builder /app/dist /app/dist

# Copy the backend code
COPY server/ /app/server/

# Copy .env file if it exists (Render will use its own env vars usually)
COPY .env* /app/

# Expose the port FastAPI will run on
EXPOSE 8000

# Set environment variables for production
ENV PORT=8000
ENV HOST=0.0.0.0
ENV FORCE_CPU=true

# Start the unified server
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
