# itinerary_pipeline.py

from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
from config import settings
import json
import sys


class ItineraryPipeline:
    def __init__(self, model_name="llama3-8b-8192", temperature=0, groq_key=None):
        """
        Initialize the pipeline with model settings.
        """
        self.llm = ChatGroq(
            groq_api_key=groq_key or settings.GROQ_API_KEY,
            model_name=model_name,
            temperature=temperature
        )

    def _build_parser(self, schema_definitions):
        """
        Create a StructuredOutputParser for the given schema.
        """
        response_schemas = [ResponseSchema(**schema) for schema in schema_definitions]
        return StructuredOutputParser.from_response_schemas(response_schemas)

    def recommend_places(self, user_preferences, min_places=20, match_ratio=0.7):
        """
        Recommend places prioritizing user experiences.
        match_ratio: proportion of results that must match experiences.
        """
        schema_definitions = [
            {
                "name": "places",
                "description": (
                    f"A list of at least {min_places} places. "
                    "Each place must include: name, lat, lng, description, estimated_cost, popularity."
                )
            }
        ]
        parser = self._build_parser(schema_definitions)
        format_instructions = parser.get_format_instructions()

        # Build prompt
        prompt = PromptTemplate(
            template="""
            You are a travel expert.
            Based on the user's preferences, recommend at least {min_places} places in the given city.
            At least {percent_match}% of these places MUST directly match the user's listed experiences.

            Rules:
            - If 'food' is an experience, focus on restaurants, cafes, street food, and local markets.
            - If 'adventure', focus on trekking, sports, water activities, or extreme sports.
            - If 'culture', focus on museums, heritage sites, local events, and art centers.
            - If 'shopping', focus on markets, malls, and local craft stores.
            - If multiple experiences are listed, ensure the recommendations are distributed across them proportionally.
            - Include other places only if they still align with the experiences OR are exceptional hidden gems relevant to them.
            - Avoid generic tourist spots unrelated to the experiences.

            For each place, provide:
            - name
            - lat (latitude)
            - lng (longitude)
            - description
            - estimated_cost (in local currency)
            - popularity (very popular, popular, moderate, hidden gem)

            Output must be valid JSON (no markdown, no commentary):
            {format_instructions}

            User preferences:
            {preferences}
            """,
            input_variables=["preferences", "min_places", "percent_match"],
            partial_variables={"format_instructions": format_instructions}
        )

        chain = prompt | self.llm | parser
        return chain.invoke({
            "preferences": user_preferences,
            "min_places": min_places,
            "percent_match": int(match_ratio * 100)
        })

    '''@staticmethod
    def get_user_input():
        """
        Collect user preferences from CLI.
        """
        if sys.stdin.isatty():
            location = input("Enter city/location: ")
            budget = input("Enter budget (low/medium/high): ")
            experiences = input("Enter experiences/interests (comma separated): ")
            return {
                "location": location.strip(),
                "budget": budget.strip(),
                "experiences": [e.strip() for e in experiences.split(",") if e.strip()]
            }
        else:
            raise RuntimeError("CLI input not available in non-interactive mode.")'''

    @staticmethod
    def pretty_print(data):
        """
        Pretty print JSON output.
        """
        print(json.dumps(data, indent=2, ensure_ascii=False))


def main():
    pipeline = ItineraryPipeline(model_name="llama3-70b-8192")
    user_input = pipeline.get_user_input()
    suggestions = pipeline.recommend_places(user_input, min_places=20, match_ratio=0.7)
    pipeline.pretty_print(suggestions)


if __name__ == "__main__":
    main()
