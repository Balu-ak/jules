from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import asyncio
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatReq(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post('/chat/query')
async def chat_query(req: ChatReq):
    async def generate():
        response_message = f"You said: {req.message}"
        for char in response_message:
            yield char
            await asyncio.sleep(0.05) # Simulate streaming delay
    return StreamingResponse(generate(), media_type="text/plain")
