from fastapi import APIRouter ,HTTPException ,status 
from pydantic import BaseModel ,Field 
from backend .services .llm_service import llm_service 

router =APIRouter ()

class TextSimplifyRequest (BaseModel ):
    original_text :str =Field (...,example ="Analyze the empirical implications of cognitive friction on user retention.")

class TextSimplifyResponse (BaseModel ):
    simplified_text :str 
    bullet_points :list [str ]

@router .post ("/simplify-text",response_model =TextSimplifyResponse )
async def simplify_exam_text (request :TextSimplifyRequest ):
    """
    Simplifies complex exam phrasing into high-legibility, bulleted statements
    for neurodivergent accessibility using Groq (Llama 3.1) via LangChain.
    """
    if not request .original_text .strip ():
        raise HTTPException (
        status_code =status .HTTP_400_BAD_REQUEST ,
        detail ="Original text cannot be empty"
        )

    result =await llm_service .simplify_text (request .original_text )

    return TextSimplifyResponse (
    simplified_text =result .get ("simplified_text",request .original_text ),
    bullet_points =result .get ("bullet_points",[])
    )
