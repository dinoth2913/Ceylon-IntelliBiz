from fastapi import FastAPI

app = FastAPI(title="Ceylon IntelliBiz AI Service")

@app.get("/health")
def health():
    return {"status": "ok", "service": "ai"}
