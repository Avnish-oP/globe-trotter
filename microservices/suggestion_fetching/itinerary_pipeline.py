from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
from config import settings


# 1. Get user input interactively (no days/duration)
def get_user_input():
    location = input("Enter city/location: ")
    budget = input("Enter budget (low/medium/high): ")
    experiences = input("Enter experiences/interests (comma separated): ")
    return {
        "location": location.strip(),
        "budget": budget.strip(),
        "experiences": [e.strip() for e in experiences.split(",") if e.strip()]
    }


# 2. Let LLM recommend as many places as possible, with cost and popularity
def recommend_places_with_llm(user_preferences, groq_key=None):
    response_schemas = [
        ResponseSchema(
            name="places",
            description="A list of places, each with: name, lat, lng, description, estimated_cost, popularity. Example: [{...}, {...}]"
        )
    ]
    parser = StructuredOutputParser.from_response_schemas(response_schemas)
    format_instructions = parser.get_format_instructions()
    prompt = PromptTemplate(
        template="""
        You are a travel expert. Given the following user preferences, recommend at least 20 must-visit places in the city. For each place, provide an estimated cost to visit (in local currency) and a popularity tag (very popular, popular, moderate, hidden gem). If possible, suggest more places.\n
        Output must be a JSON object with a 'places' key, whose value is a list of place objects as described above. No markdown, no code blocks, no extra commentary.\n{format_instructions}\nUser preferences: {preferences}
        """,
        input_variables=["preferences"],
        partial_variables={"format_instructions": format_instructions}
    )
    llm = ChatGroq(
        groq_api_key=groq_key or settings.GROQ_API_KEY,
        model_name="llama3-8b-8192",
        temperature=0
    )
    chain = prompt | llm | parser
    return chain.invoke({"preferences": user_preferences})


# 3. Main pipeline
def main():
    user_input = get_user_input()
    suggestions = recommend_places_with_llm(user_input, settings.GROQ_API_KEY)
    print(suggestions)

if __name__ == "__main__":
    main()
