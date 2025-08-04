"""
Business Analyst Agent
Analyzes business requirements and provides strategic recommendations
"""

from typing import List, Dict, Any
from crewai import Agent
from langchain.tools import Tool
from langchain_openai import ChatOpenAI
from langchain_community.tools import DuckDuckGoSearchRun
from langchain.memory import ConversationBufferMemory
import redis

class BusinessAnalystAgent:
    def __init__(self, llm: ChatOpenAI, redis_client: redis.Redis):
        self.llm = llm
        self.redis_client = redis_client
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        
        # Agent metadata
        self.name = "Business Analyst"
        self.description = "Expert in analyzing business requirements and providing strategic recommendations"
        self.capabilities = [
            "analyze_business_requirements",
            "identify_growth_opportunities",
            "competitive_analysis",
            "market_research",
            "workflow_optimization",
            "roi_calculation",
            "risk_assessment"
        ]
        
        # Initialize tools
        self.tools = self._create_tools()
        
        # Create the CrewAI agent
        self.agent = self._create_agent()
    
    def _create_tools(self) -> List[Tool]:
        """Create specialized tools for business analysis"""
        tools = []
        
        # Web search for market research
        search = DuckDuckGoSearchRun()
        tools.append(Tool(
            name="market_research",
            description="Search the web for market trends and competitor analysis",
            func=search.run
        ))
        
        # Business metrics calculator
        tools.append(Tool(
            name="calculate_roi",
            description="Calculate ROI and other business metrics",
            func=self._calculate_roi
        ))
        
        # Workflow analyzer
        tools.append(Tool(
            name="analyze_workflow",
            description="Analyze and optimize business workflows",
            func=self._analyze_workflow
        ))
        
        # Risk assessment tool
        tools.append(Tool(
            name="assess_risk",
            description="Assess business and technical risks",
            func=self._assess_risk
        ))
        
        return tools
    
    def _create_agent(self) -> Agent:
        """Create the CrewAI agent instance"""
        return Agent(
            role="Senior Business Analyst",
            goal="Analyze business requirements and provide data-driven strategic recommendations",
            backstory="""You are an experienced business analyst with expertise in:
            - Business process optimization
            - Market analysis and competitive intelligence
            - Financial modeling and ROI calculation
            - Risk assessment and mitigation
            - Digital transformation strategies
            - Data-driven decision making
            
            You excel at understanding complex business needs and translating them
            into actionable technical requirements.""",
            tools=self.tools,
            llm=self.llm,
            verbose=True,
            memory=True
        )
    
    def get_crewai_agent(self) -> Agent:
        """Return the CrewAI agent for crew composition"""
        return self.agent
    
    async def execute_task(self, task: Any, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a business analysis task"""
        analysis_type = parameters.get("type", "general")
        
        result = {
            "analysis": {},
            "recommendations": [],
            "metrics": {},
            "risks": []
        }
        
        try:
            if analysis_type == "market_research":
                # Perform market research
                market_data = self.tools[0].func(parameters.get("query", ""))
                result["analysis"]["market"] = self._parse_market_data(market_data)
                
            elif analysis_type == "roi_calculation":
                # Calculate ROI
                roi_data = self._calculate_roi(parameters)
                result["metrics"]["roi"] = roi_data
                
            elif analysis_type == "workflow_optimization":
                # Analyze workflow
                workflow_analysis = self._analyze_workflow(parameters)
                result["analysis"]["workflow"] = workflow_analysis
                result["recommendations"] = workflow_analysis.get("improvements", [])
                
            elif analysis_type == "comprehensive":
                # Comprehensive business analysis
                business_name = parameters.get("business_name", "the business")
                industry = parameters.get("industry", "general")
                
                # Market research
                market_query = f"{business_name} {industry} market trends competitors"
                market_data = self.tools[0].func(market_query)
                result["analysis"]["market"] = self._parse_market_data(market_data)
                
                # ROI calculation
                if parameters.get("financial_data"):
                    roi_data = self._calculate_roi(parameters.get("financial_data"))
                    result["metrics"]["roi"] = roi_data
                
                # Risk assessment
                risks = self._assess_risk(parameters)
                result["risks"] = risks
                
                # Generate recommendations
                result["recommendations"] = self._generate_recommendations(
                    result["analysis"],
                    result["metrics"],
                    result["risks"]
                )
            
            # Store result in Redis
            result_key = f"business_analysis_result:{task.id}"
            self.redis_client.setex(result_key, 3600, str(result))
            
            return result
            
        except Exception as e:
            return {
                "error": str(e),
                "analysis": {},
                "recommendations": ["Unable to complete analysis due to an error"]
            }
    
    def _calculate_roi(self, params: Dict[str, Any]) -> Dict[str, float]:
        """Calculate ROI and related metrics"""
        investment = params.get("investment", 0)
        revenue = params.get("revenue", 0)
        costs = params.get("costs", 0)
        timeframe = params.get("timeframe_months", 12)
        
        if investment == 0:
            return {"error": "Investment amount cannot be zero"}
        
        net_profit = revenue - costs - investment
        roi = (net_profit / investment) * 100
        monthly_roi = roi / timeframe
        payback_period = investment / ((revenue - costs) / timeframe) if revenue > costs else float('inf')
        
        return {
            "roi_percentage": round(roi, 2),
            "monthly_roi": round(monthly_roi, 2),
            "payback_period_months": round(payback_period, 1),
            "net_profit": round(net_profit, 2),
            "profit_margin": round((net_profit / revenue * 100) if revenue > 0 else 0, 2)
        }
    
    def _analyze_workflow(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze business workflow for optimization opportunities"""
        workflow_steps = params.get("steps", [])
        current_time = params.get("current_time_hours", 0)
        current_cost = params.get("current_cost", 0)
        
        # Identify bottlenecks and inefficiencies
        bottlenecks = []
        automation_opportunities = []
        
        for step in workflow_steps:
            if step.get("manual", True):
                automation_opportunities.append({
                    "step": step.get("name"),
                    "potential_time_savings": step.get("time", 0) * 0.7,
                    "automation_method": "AI/RPA automation"
                })
            
            if step.get("time", 0) > current_time * 0.2:  # Step takes >20% of total time
                bottlenecks.append({
                    "step": step.get("name"),
                    "impact": "High",
                    "recommendation": "Optimize or parallelize this step"
                })
        
        return {
            "bottlenecks": bottlenecks,
            "automation_opportunities": automation_opportunities,
            "estimated_time_savings": sum(opp["potential_time_savings"] for opp in automation_opportunities),
            "estimated_cost_savings": current_cost * 0.3,  # Rough estimate
            "improvements": [
                f"Automate {opp['step']} to save {opp['potential_time_savings']} hours"
                for opp in automation_opportunities[:3]
            ]
        }
    
    def _assess_risk(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Assess business and technical risks"""
        risks = []
        
        # Business risks
        if params.get("market_volatility", False):
            risks.append({
                "type": "business",
                "name": "Market Volatility",
                "impact": "High",
                "probability": "Medium",
                "mitigation": "Diversify revenue streams and maintain flexible operations"
            })
        
        # Technical risks
        if params.get("legacy_systems", False):
            risks.append({
                "type": "technical",
                "name": "Legacy System Dependencies",
                "impact": "Medium",
                "probability": "High",
                "mitigation": "Plan phased migration to modern systems"
            })
        
        # Security risks
        if params.get("handles_sensitive_data", False):
            risks.append({
                "type": "security",
                "name": "Data Security Compliance",
                "impact": "High",
                "probability": "Low",
                "mitigation": "Implement encryption, access controls, and regular audits"
            })
        
        # Operational risks
        if params.get("rapid_growth", False):
            risks.append({
                "type": "operational",
                "name": "Scaling Challenges",
                "impact": "Medium",
                "probability": "High",
                "mitigation": "Build scalable infrastructure and processes from the start"
            })
        
        return risks
    
    def _parse_market_data(self, raw_data: str) -> Dict[str, Any]:
        """Parse market research data"""
        # In production, this would use NLP to extract insights
        return {
            "summary": raw_data[:500] if len(raw_data) > 500 else raw_data,
            "key_insights": [
                "Market is growing at 15% annually",
                "Main competitors focus on enterprise clients",
                "Gap in SMB market segment"
            ],
            "opportunities": [
                "Untapped SMB market",
                "Mobile-first approach differentiator",
                "AI integration as competitive advantage"
            ]
        }
    
    def _generate_recommendations(self, analysis: Dict, metrics: Dict, risks: List) -> List[str]:
        """Generate strategic recommendations based on analysis"""
        recommendations = []
        
        # Based on market analysis
        if "market" in analysis:
            recommendations.append("Focus on SMB market segment with tailored pricing")
            recommendations.append("Implement mobile-first strategy to differentiate")
        
        # Based on ROI metrics
        if metrics.get("roi", {}).get("payback_period_months", float('inf')) > 12:
            recommendations.append("Explore ways to reduce initial investment or accelerate revenue")
        
        # Based on risks
        high_impact_risks = [r for r in risks if r.get("impact") == "High"]
        if high_impact_risks:
            recommendations.append(f"Prioritize mitigation of {len(high_impact_risks)} high-impact risks")
        
        # General recommendations
        recommendations.extend([
            "Implement continuous monitoring and KPI tracking",
            "Build in flexibility for rapid market changes",
            "Focus on customer retention alongside acquisition"
        ])
        
        return recommendations[:5]  # Top 5 recommendations