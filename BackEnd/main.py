from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import os


print("Python file is working fine");
# Load environment variables
load_dotenv()
# FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print(os.getenv("GROQ_API_KEY"))
# Groq Client
client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

# Request model
class ChatRequest(BaseModel):
    messages: list


@app.post("/smart-ai-chat")
async def chat(req: ChatRequest):

    try:

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",

            messages=req.messages,

            temperature=0.7,
            max_tokens=1000
        )

        return {
            "reply": response.choices[0].message.content
        }

    except Exception as e:

        return {
            "error": str(e)
        }