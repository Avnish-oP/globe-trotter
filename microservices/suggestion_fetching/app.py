from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from itinerary_pipeline import ItineraryPipeline
from config import settings
import json
import dotenv

dotenv.load_dotenv()
app = FastAPI()

class SuggestionRequest(BaseModel):
    location: str
    budget: str
    experiences: List[str]

# Initialize the pipeline once
pipeline = ItineraryPipeline(groq_key=settings.GROQ_API_KEY)

@app.post("/suggestions")
def get_suggestions(req: SuggestionRequest):
    user_input = {
        "location": req.location,
        "budget": req.budget,
        "experiences": req.experiences
    }
    try:
        suggestions = pipeline.recommend_places(user_input, min_places=20, match_ratio=0.7)
        return JSONResponse(content={"suggestions": json.loads(json.dumps(suggestions))})
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

# Optional: root endpoint
@app.get("/")
def root():
    return {"message": "Itinerary Suggestion API is running."}
