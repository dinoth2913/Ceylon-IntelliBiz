from fastapi import FastAPI

from assistant import respond
from insights import generate_insights
from models import BusinessContext, ChatRequest, ChatResponse, Insight

app = FastAPI(title="Ceylon IntelliBiz AI Service", version="0.2.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    return respond(request.message, request.context)


@app.post("/insights", response_model=list[Insight])
def insights(context: BusinessContext) -> list[Insight]:
    return generate_insights(context)
