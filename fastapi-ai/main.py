from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

# Import our ML models
from ml_models import StoryGenerator, HybridRagAssistant, ScenarioAssistant

app = FastAPI(title="JeevanGyaan AI Service")

# Allow requests from the Node.js backend setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your node js backend IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
print("Initializing ML Models... This may take a moment.")
story_gen = StoryGenerator()
chat_assist = HybridRagAssistant()
scenario_assist = ScenarioAssistant()
print("Models initialized successfully!")

class StoryRequest(BaseModel):
    content: str
    language: Optional[str] = "en"

class ChatMessage(BaseModel):
    text: str

class ChatHistoryItem(BaseModel):
    role: str
    parts: List[dict]

class ModuleItem(BaseModel):
    title: str
    description: str
    category: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatHistoryItem]] = None
    modules: Optional[List[ModuleItem]] = None
    language: Optional[str] = "en"

class ScenarioRequest(BaseModel):
    message: str
    history: List[ChatHistoryItem]
    language: Optional[str] = "en"

class DebateRequest(BaseModel):
    topic: str
    argument: str
    language: Optional[str] = "en"

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/generate-story")
def generate_story_endpoint(request: StoryRequest):
    try:
        if not request.content:
            raise HTTPException(status_code=400, detail="Content is required")
        
        story = story_gen.generate(request.content, request.language)
        return {"success": True, "data": story}
    except Exception as e:
        print(f"Error generating story: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat-assist")
def chat_assist_endpoint(request: ChatRequest):
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Convert Pydantic module models to dictionary list
        modules_list = [m.dict() for m in request.modules] if request.modules else []
        
        # Properly format history for the chat template
        context_messages = []
        if request.history:
            for item in request.history:
                role = "assistant" if item.role == 'model' else "user"
                if len(item.parts) > 0 and 'text' in item.parts[0]:
                    context_messages.append({"role": role, "content": item.parts[0]['text']})
        
        # Use Hybrid RAG for recommendations and answering
        reply = chat_assist.get_response(request.message, context_messages, modules_list, request.language)
        
        return {"success": True, "reply": reply}
    except Exception as e:
        print(f"Error in chat assist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/debate-assist")
def debate_assist_endpoint(request: DebateRequest):
    try:
        if not request.topic or not request.argument:
            raise HTTPException(status_code=400, detail="Topic and argument are required")
        
        reply = chat_assist.evaluate_debate(request.topic, request.argument, request.language)
        return {"success": True, "reply": reply}
    except Exception as e:
        print(f"Error in debate assist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scenario-assist")
def scenario_assist_endpoint(request: ScenarioRequest):
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="Message is required")
            
        context_messages = []
        if request.history:
            for item in request.history:
                if item.role == 'system':
                    role = "system"
                elif item.role == 'model':
                    role = "assistant"
                else: 
                    role = "user"
                if len(item.parts) > 0 and 'text' in item.parts[0]:
                    context_messages.append({"role": role, "content": item.parts[0]['text']})
                    
        reply = scenario_assist.get_scenario_response(request.message, context_messages, request.language)
        return {"success": True, "reply": reply}
    except Exception as e:
        print(f"Error in scenario assist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scenario-evaluate")
def scenario_evaluate_endpoint(request: ScenarioRequest):
    try:
        context_messages = []
        if request.history:
            for item in request.history:
                if item.role == 'system':
                    role = "system"
                elif item.role == 'model':
                    role = "assistant"
                else: 
                    role = "user"
                if len(item.parts) > 0 and 'text' in item.parts[0]:
                    context_messages.append({"role": role, "content": item.parts[0]['text']})
                    
        reply = scenario_assist.evaluate_scenario(context_messages, request.language)
        return {"success": True, "reply": reply}
    except Exception as e:
        print(f"Error in scenario evaluate: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
