import os
from typing import Dict, List, Any
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

from backend.config import settings


# Pydantic model for structured output parsing
class SimplifiedTextOutput(BaseModel):
    simplified_text: str = Field(
        description="The simplified, high-legibility version of the original exam text."
    )
    bullet_points: List[str] = Field(
        description="3 to 4 concise bullet points highlighting key concepts for neurodivergent students."
    )


class LLMAccessibilityService:
    def __init__(self):
        # Initialize Groq client if API key exists, else run fallback mode
        self.api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        
        if self.api_key:
            self.llm = ChatGroq(
                temperature=0.2,
                model_name="llama-3.1-8b-instant",
                groq_api_key=self.api_key
            )
            self.parser = JsonOutputParser(pydantic_object=SimplifiedTextOutput)
            
            self.prompt = ChatPromptTemplate.from_messages([
                (
                    "system",
                    "You are an expert accessibility assistant specializing in adapting complex academic text for students with dyslexia and ADHD. "
                    "Your goal is to make text clearer without removing essential academic meaning or giving away exam answers.\n"
                    "Formatting Rules:\n"
                    "1. Use active voice and short sentences.\n"
                    "2. Avoid double negatives and overly convoluted jargon.\n"
                    "3. Return the output in STRICT JSON format following the schema provided.\n"
                    "{format_instructions}"
                ),
                ("user", "Simplify the following exam passage/question:\n\n{original_text}")
            ])
        else:
            self.llm = None

    async def simplify_text(self, original_text: str) -> Dict[str, Any]:
        """
        Processes exam text through LangChain + Groq.
        Falls back to rule-based simplification if no API key is provided.
        """
        if not self.llm:
            # Fallback for offline development / hackathon demos without API key
            return {
                "simplified_text": f"Simplified Version: {original_text[:150]}...",
                "bullet_points": [
                    "Main Idea: Focus on the primary question requirement.",
                    "Key Factor: Identify the core variable mentioned.",
                    "Goal: Select the option that directly addresses the problem."
                ]
            }

        try:
            chain = self.prompt | self.llm | self.parser
            result = await chain.ainvoke({
                "original_text": original_text,
                "format_instructions": self.parser.get_format_instructions()
            })
            return result
        except Exception as e:
            print(f"LLM Processing Error: {e}")
            return {
                "simplified_text": original_text,
                "bullet_points": ["Note: Real-time AI formatting currently offline."]
            }


# Singleton instance for import across routes
llm_service = LLMAccessibilityService()