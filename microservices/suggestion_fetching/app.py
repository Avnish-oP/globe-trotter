from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from itinerary_pipeline import recommend_places_with_llm
from config import settings
import json

app = FastAPI()

class SuggestionRequest(BaseModel):
    location: str
    budget: str
    experiences: List[str]

@app.post("/suggestions")
def get_suggestions(req: SuggestionRequest):
    user_input = {
        "location": req.location,
        "budget": req.budget,
        "experiences": req.experiences
    }
    try:
        suggestions = recommend_places_with_llm(user_input, settings.GROQ_API_KEY)
        return JSONResponse(content={"suggestions": json.loads(json.dumps(suggestions))})
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

# Optional: root endpoint
@app.get("/")
def root():
    return {"message": "Itinerary Suggestion API is running."}
