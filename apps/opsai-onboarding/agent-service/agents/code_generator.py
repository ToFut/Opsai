"""
Code Generator Agent
Specializes in generating production-ready code based on requirements
"""

from typing import List, Dict, Any, Optional
from crewai import Agent
from langchain.tools import Tool
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
import redis

from ..tools import (
    CodeAnalysisTool,
    APIGeneratorTool,
    DatabaseSchemaTool,
    TestGeneratorTool,
    ComponentGeneratorTool,
    DocumentationGeneratorTool
)

class CodeGeneratorAgent:
    def __init__(self, llm: ChatOpenAI, redis_client: redis.Redis):
        self.llm = llm
        self.redis_client = redis_client
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        
        # Agent metadata
        self.name = "Code Generator"
        self.description = "Expert in generating production-ready code for various frameworks and languages"
        self.capabilities = [
            "generate_react_components",
            "create_api_endpoints",
            "design_database_schemas",
            "write_unit_tests",
            "create_documentation",
            "optimize_performance",
            "implement_security_best_practices"
        ]
        
        # Initialize tools
        self.tools = self._create_tools()
        
        # Create the CrewAI agent
        self.agent = self._create_agent()
    
    def _create_tools(self) -> List[Tool]:
        """Create specialized tools for code generation"""
        tools = []
        
        # Component Generator
        component_tool = ComponentGeneratorTool()
        tools.append(Tool(
            name="generate_component",
            description="Generate React/Vue/Angular components with proper structure",
            func=component_tool.generate
        ))
        
        # API Generator
        api_tool = APIGeneratorTool()
        tools.append(Tool(
            name="generate_api",
            description="Generate REST or GraphQL API endpoints",
            func=api_tool.generate
        ))
        
        # Database Schema Generator
        db_tool = DatabaseSchemaTool()
        tools.append(Tool(
            name="generate_schema",
            description="Generate database schemas and migrations",
            func=db_tool.generate
        ))
        
        # Test Generator
        test_tool = TestGeneratorTool()
        tools.append(Tool(
            name="generate_tests",
            description="Generate unit and integration tests",
            func=test_tool.generate
        ))
        
        # Documentation Generator
        doc_tool = DocumentationGeneratorTool()
        tools.append(Tool(
            name="generate_docs",
            description="Generate code documentation and API docs",
            func=doc_tool.generate
        ))
        
        # Code Analysis Tool
        analysis_tool = CodeAnalysisTool()
        tools.append(Tool(
            name="analyze_code",
            description="Analyze existing code for improvements",
            func=analysis_tool.analyze
        ))
        
        return tools
    
    def _create_agent(self) -> Agent:
        """Create the CrewAI agent instance"""
        return Agent(
            role="Senior Full-Stack Developer",
            goal="Generate high-quality, production-ready code that follows best practices",
            backstory="""You are an experienced full-stack developer with expertise in:
            - Modern JavaScript frameworks (React, Vue, Angular)
            - Backend technologies (Node.js, Python, Go)
            - Database design (PostgreSQL, MongoDB, Redis)
            - API design (REST, GraphQL)
            - Testing strategies (Unit, Integration, E2E)
            - Security best practices
            - Performance optimization
            
            You always write clean, maintainable code with proper error handling,
            documentation, and test coverage.""",
            tools=self.tools,
            llm=self.llm,
            verbose=True,
            memory=True
        )
    
    def get_crewai_agent(self) -> Agent:
        """Return the CrewAI agent for crew composition"""
        return self.agent
    
    async def execute_task(self, task: Any, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a code generation task"""
        task_type = parameters.get("type", "component")
        
        # Store context in Redis for persistence
        context_key = f"code_gen_context:{task.id}"
        self.redis_client.setex(context_key, 3600, str(parameters))
        
        result = {
            "files": [],
            "instructions": [],
            "dependencies": []
        }
        
        try:
            if task_type == "component":
                # Generate React component
                component_result = self.tools[0].func(parameters)
                result["files"].append({
                    "path": f"src/components/{parameters.get('name', 'Component')}.tsx",
                    "content": component_result["code"],
                    "language": "typescript"
                })
                result["instructions"] = component_result.get("instructions", [])
                
            elif task_type == "api":
                # Generate API endpoint
                api_result = self.tools[1].func(parameters)
                result["files"].append({
                    "path": f"src/api/{parameters.get('endpoint', 'resource')}.ts",
                    "content": api_result["code"],
                    "language": "typescript"
                })
                result["dependencies"] = api_result.get("dependencies", [])
                
            elif task_type == "full_feature":
                # Generate complete feature (component + API + tests)
                feature_name = parameters.get("name", "Feature")
                
                # Generate component
                component_result = self.tools[0].func({
                    **parameters,
                    "name": f"{feature_name}Component"
                })
                result["files"].append({
                    "path": f"src/components/{feature_name}/{feature_name}.tsx",
                    "content": component_result["code"],
                    "language": "typescript"
                })
                
                # Generate API
                api_result = self.tools[1].func({
                    **parameters,
                    "endpoint": feature_name.lower()
                })
                result["files"].append({
                    "path": f"src/api/{feature_name.lower()}.ts",
                    "content": api_result["code"],
                    "language": "typescript"
                })
                
                # Generate tests
                test_result = self.tools[3].func({
                    "component": feature_name,
                    "type": "unit"
                })
                result["files"].append({
                    "path": f"src/__tests__/{feature_name}.test.tsx",
                    "content": test_result["code"],
                    "language": "typescript"
                })
                
                # Combine all instructions and dependencies
                result["instructions"] = [
                    *component_result.get("instructions", []),
                    *api_result.get("instructions", []),
                    *test_result.get("instructions", [])
                ]
                result["dependencies"] = list(set(
                    component_result.get("dependencies", []) +
                    api_result.get("dependencies", []) +
                    test_result.get("dependencies", [])
                ))
            
            # Store result in Redis
            result_key = f"code_gen_result:{task.id}"
            self.redis_client.setex(result_key, 3600, str(result))
            
            return result
            
        except Exception as e:
            return {
                "error": str(e),
                "files": [],
                "instructions": ["An error occurred during code generation"]
            }
    
    def analyze_existing_code(self, code_path: str) -> Dict[str, Any]:
        """Analyze existing code and suggest improvements"""
        analysis_result = self.tools[5].func({"path": code_path})
        
        return {
            "issues": analysis_result.get("issues", []),
            "suggestions": analysis_result.get("suggestions", []),
            "refactored_code": analysis_result.get("refactored_code", "")
        }