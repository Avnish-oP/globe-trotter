
# Suggestion Fetching Microservice

This microservice provides travel suggestions using FastAPI and integrates with the Groq API.

## Setup

1. **Clone the repository** and navigate to this folder.

2. **Create and activate a virtual environment (recommended):**
	```
	uv venv .venv
	.venv\Scripts\activate
	```

3. **Install dependencies:**
	```
	uv pip install -r requirements.txt
	```

4. **Set up your `.env` file** with your Groq API key:
	```
	GROQ_API_KEY=your_actual_api_key
	```

## Running the Service

Start the FastAPI server with:

```
uvicorn app:app --reload
```

The API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000) by default.

### `/suggestions` Endpoint

- **URL:** `http://127.0.0.1:8000/suggestions`
- **Method:** `POST`
- **Request Body Example:**
	```json
	{
		"location": "Paris",
		"budget": "medium",
		"experiences": ["culture", "food"]
	}
	```
- **Response:** JSON with travel suggestions.

## Development

- Main entry point: `app.py`
- Example test script: `main.py`
- Environment variables are loaded from `.env` using `python-dotenv`.

## Notes

- Do **not** commit your `.env` file or API keys to version control.
- For API documentation, visit [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) after starting the server.
