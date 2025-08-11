import os
from dotenv import load_dotenv

class Settings:
	def __init__(self, env_path=None):
		if env_path:
			load_dotenv(env_path)
		else:
			load_dotenv()
		self.GROQ_API_KEY = os.getenv("GROQ_API_KEY")

settings = Settings()
