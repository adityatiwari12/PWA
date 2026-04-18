from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI()

# Enable CORS for PWA development and cross-origin assets
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ready", "mode": "lightweight_host"}

# ---------------------------------------------------------------------------
# PWA Static File Serving
# ---------------------------------------------------------------------------
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "dist")

if os.path.isdir(frontend_dist):
    # Serve static assets (/assets/*)
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_pwa(full_path: str):
        # Prevent API routes from falling into PWA catch-all
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        # 1. Check if the file exists directly in dist (manifest, icons, etc.)
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # 2. Fallback to index.html for SPA routing
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_path):
             return FileResponse(index_path)
             
        return {"error": "Frontend build not found. Run npm run build."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
