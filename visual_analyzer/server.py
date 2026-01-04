from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import shutil
import tempfile
from engine import VisualDiagnosisEngine

app = FastAPI(title="Sanjeevani Visual Diagnosis Bridge")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = VisualDiagnosisEngine()

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        # Create a temporary file to store the uploaded image
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
            shutil.copyfileobj(file.file, temp)
            temp_path = temp.name

        # Run analysis using the engine
        result = engine.analyze(temp_path)

        # Clean up the temporary file
        os.unlink(temp_path)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "online", "engine": "VisualDiagnosisEngine v1.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
