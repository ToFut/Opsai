"""
OpsAI Agent Service - CrewAI + LangChain Integration
Main orchestration service for intelligent agents
"""

import os
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import json

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis
from dotenv import load_dotenv

# CrewAI imports
from crewai import Agent, Task, Crew, Process

# LangChain imports
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain_community.tools import DuckDuckGoSearchRun
from langchain.tools import Tool, StructuredTool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# Custom agents and tools
from agents import (
    BusinessAnalystAgent,
    CodeGeneratorAgent,
    IntegrationSpecialistAgent,
    DeploymentAgent,
    CommunicationAgent,
    FinanceAgent
)
from tools import (
    CodeAnalysisTool,
    APIGeneratorTool,
    DatabaseSchemaTool,
    TestGeneratorTool,
    TwilioCallTool,
    StripePaymentTool,
    EmailSenderTool
)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="OpsAI Agent Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis for agent memory and communication
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)

# Initialize LLM
llm = ChatOpenAI(
    temperature=0.7,
    model="gpt-4-turbo-preview",
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

# WebSocket manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
    
    async def send_message(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = ConnectionManager()

# Request/Response Models
class AgentRequest(BaseModel):
    task_type: str
    context: Dict[str, Any]
    parameters: Optional[Dict[str, Any]] = {}
    session_id: Optional[str] = None

class AgentResponse(BaseModel):
    success: bool
    task_id: str
    result: Optional[Any] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None

# Agent Registry
AGENT_REGISTRY = {
    "business_analyst": BusinessAnalystAgent,
    "code_generator": CodeGeneratorAgent,
    "integration_specialist": IntegrationSpecialistAgent,
    "deployment_agent": DeploymentAgent,
    "communication_agent": CommunicationAgent,
    "finance_agent": FinanceAgent
}

# Crew Templates for common workflows
CREW_TEMPLATES = {
    "full_app_generation": {
        "agents": ["business_analyst", "code_generator", "deployment_agent"],
        "process": Process.sequential
    },
    "integration_setup": {
        "agents": ["integration_specialist"],
        "process": Process.sequential
    },
    "business_automation": {
        "agents": ["business_analyst", "communication_agent", "finance_agent"],
        "process": Process.hierarchical
    }
}

@app.get("/")
async def root():
    return {
        "service": "OpsAI Agent Service",
        "status": "operational",
        "agents": list(AGENT_REGISTRY.keys()),
        "crews": list(CREW_TEMPLATES.keys())
    }

@app.post("/agents/execute", response_model=AgentResponse)
async def execute_agent_task(request: AgentRequest):
    """Execute a single agent task"""
    task_id = f"task_{datetime.now().timestamp()}"
    
    try:
        # Get or create agent
        if request.task_type not in AGENT_REGISTRY:
            raise HTTPException(status_code=400, detail=f"Unknown agent type: {request.task_type}")
        
        agent_class = AGENT_REGISTRY[request.task_type]
        agent = agent_class(llm=llm, redis_client=redis_client)
        
        # Create and execute task
        task = Task(
            description=request.context.get("description", ""),
            agent=agent,
            expected_output=request.context.get("expected_output", "Completed task output")
        )
        
        # Execute with progress updates via WebSocket
        if request.session_id:
            await manager.send_message(request.session_id, {
                "type": "task_started",
                "task_id": task_id,
                "agent": request.task_type
            })
        
        # Execute task
        result = await agent.execute_task(task, request.parameters)
        
        # Store result in Redis
        redis_client.setex(
            f"task_result:{task_id}",
            3600,  # 1 hour TTL
            json.dumps(result)
        )
        
        # Send completion update
        if request.session_id:
            await manager.send_message(request.session_id, {
                "type": "task_completed",
                "task_id": task_id,
                "result": result
            })
        
        return AgentResponse(
            success=True,
            task_id=task_id,
            result=result
        )
        
    except Exception as e:
        return AgentResponse(
            success=False,
            task_id=task_id,
            error=str(e)
        )

@app.post("/crews/execute")
async def execute_crew_workflow(
    crew_type: str,
    context: Dict[str, Any],
    session_id: Optional[str] = None
):
    """Execute a multi-agent crew workflow"""
    if crew_type not in CREW_TEMPLATES:
        raise HTTPException(status_code=400, detail=f"Unknown crew type: {crew_type}")
    
    crew_config = CREW_TEMPLATES[crew_type]
    workflow_id = f"workflow_{datetime.now().timestamp()}"
    
    try:
        # Create agents
        agents = []
        for agent_type in crew_config["agents"]:
            agent_class = AGENT_REGISTRY[agent_type]
            agent = agent_class(llm=llm, redis_client=redis_client)
            agents.append(agent.get_crewai_agent())
        
        # Create tasks based on context
        tasks = create_tasks_from_context(context, agents)
        
        # Create and run crew
        crew = Crew(
            agents=agents,
            tasks=tasks,
            process=crew_config["process"],
            verbose=True
        )
        
        # Execute with progress updates
        if session_id:
            await manager.send_message(session_id, {
                "type": "crew_started",
                "workflow_id": workflow_id,
                "agents": crew_config["agents"]
            })
        
        result = crew.kickoff()
        
        # Store result
        redis_client.setex(
            f"workflow_result:{workflow_id}",
            3600,
            json.dumps({"result": str(result), "context": context})
        )
        
        if session_id:
            await manager.send_message(session_id, {
                "type": "crew_completed",
                "workflow_id": workflow_id,
                "result": str(result)
            })
        
        return {
            "success": True,
            "workflow_id": workflow_id,
            "result": str(result)
        }
        
    except Exception as e:
        return {
            "success": False,
            "workflow_id": workflow_id,
            "error": str(e)
        }

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()
            
            # Handle ping/pong or other control messages
            if data == "ping":
                await websocket.send_text("pong")
            else:
                # Process other messages if needed
                message = json.loads(data)
                await handle_websocket_message(client_id, message)
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)

async def handle_websocket_message(client_id: str, message: dict):
    """Handle incoming WebSocket messages"""
    message_type = message.get("type")
    
    if message_type == "get_task_status":
        task_id = message.get("task_id")
        result = redis_client.get(f"task_result:{task_id}")
        
        await manager.send_message(client_id, {
            "type": "task_status",
            "task_id": task_id,
            "status": "completed" if result else "pending",
            "result": json.loads(result) if result else None
        })

def create_tasks_from_context(context: Dict[str, Any], agents: List[Agent]) -> List[Task]:
    """Create tasks based on the provided context"""
    tasks = []
    
    # Example task creation logic
    if "analyze_business" in context:
        tasks.append(Task(
            description=f"Analyze the business requirements for {context.get('business_name', 'the application')}",
            agent=agents[0],  # Business analyst
            expected_output="Detailed business analysis with recommendations"
        ))
    
    if "generate_code" in context:
        tasks.append(Task(
            description=f"Generate code for {context.get('feature', 'requested feature')}",
            agent=agents[1] if len(agents) > 1 else agents[0],  # Code generator
            expected_output="Generated code files with documentation"
        ))
    
    if "deploy_app" in context:
        tasks.append(Task(
            description=f"Deploy the application to {context.get('platform', 'production')}",
            agent=agents[2] if len(agents) > 2 else agents[-1],  # Deployment agent
            expected_output="Deployment confirmation with URLs"
        ))
    
    return tasks

@app.get("/agents/list")
async def list_agents():
    """List all available agents and their capabilities"""
    agents_info = {}
    
    for agent_type, agent_class in AGENT_REGISTRY.items():
        agent = agent_class(llm=llm, redis_client=redis_client)
        agents_info[agent_type] = {
            "name": agent.name,
            "description": agent.description,
            "capabilities": agent.capabilities,
            "tools": [tool.name for tool in agent.tools]
        }
    
    return agents_info

@app.get("/crews/list")
async def list_crews():
    """List all available crew templates"""
    return CREW_TEMPLATES

@app.get("/tasks/{task_id}/status")
async def get_task_status(task_id: str):
    """Get the status and result of a specific task"""
    result = redis_client.get(f"task_result:{task_id}")
    
    if result:
        return {
            "status": "completed",
            "result": json.loads(result)
        }
    else:
        return {
            "status": "pending",
            "result": None
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)