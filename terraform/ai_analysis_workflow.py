# ========================================
# 3. AI ANALYSIS WORKFLOW
# ========================================

import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
import asyncio
from supabase import create_client, Client
import openai

class UserWorkflowAnalyzer:
    """AI-powered analysis of user workflows based on synced data"""
    
    def __init__(self, supabase_url: str, supabase_key: str, openai_key: str):
        self.supabase: Client = create_client(supabase_url, supabase_key)
        openai.api_key = openai_key
        
    async def analyze_user_workflow(self, user_id: str) -> Dict[str, Any]:
        """Complete workflow analysis for a user"""
        
        # 1. Fetch unified data
        user_data = await self._fetch_user_data(user_id)
        
        # 2. Analyze patterns
        patterns = await self._analyze_patterns(user_data)
        
        # 3. Generate insights
        insights = await self._generate_ai_insights(user_data, patterns)
        
        # 4. Create recommendations
        recommendations = await self._create_recommendations(insights)
        
        # 5. Store analysis results
        await self._store_analysis(user_id, insights, recommendations)
        
        return {
            "user_id": user_id,
            "patterns": patterns,
            "insights": insights,
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat()
        }
    
    async def _fetch_user_data(self, user_id: str) -> Dict[str, Any]:
        """Fetch all relevant user data from organized views"""
        
        # Fetch from unified views
        customer_data = self.supabase.table('unified_customers') \
            .select("*") \
            .eq('user_id', user_id) \
            .execute()
            
        developer_data = self.supabase.table('developer_activity') \
            .select("*") \
            .eq('user_id', user_id) \
            .execute()
            
        revenue_data = self.supabase.table('revenue_analytics') \
            .select("*") \
            .eq('user_id', user_id) \
            .order('month', desc=False) \
            .execute()
            
        website_data = self.supabase.table('website_analytics') \
            .select("*") \
            .eq('user_id', user_id) \
            .limit(30) \
            .execute()
        
        return {
            "customer": customer_data.data[0] if customer_data.data else {},
            "developer": developer_data.data[0] if developer_data.data else {},
            "revenue": revenue_data.data,
            "website": website_data.data
        }
    
    async def _analyze_patterns(self, user_data: Dict) -> Dict[str, Any]:
        """Analyze behavioral patterns from the data"""
        
        patterns = {
            "revenue_patterns": self._analyze_revenue_patterns(user_data['revenue']),
            "development_patterns": self._analyze_dev_patterns(user_data['developer']),
            "customer_patterns": self._analyze_customer_patterns(user_data['customer']),
            "website_patterns": self._analyze_website_patterns(user_data['website'])
        }
        
        return patterns
    
    def _analyze_revenue_patterns(self, revenue_data: List[Dict]) -> Dict:
        """Analyze revenue trends and patterns"""
        if not revenue_data:
            return {"status": "no_data"}
            
        latest_revenue = revenue_data[-1]['revenue'] if revenue_data else 0
        growth_rates = [r['growth_rate'] for r in revenue_data if r.get('growth_rate')]
        
        return {
            "trend": "growing" if sum(growth_rates) > 0 else "declining",
            "avg_growth_rate": sum(growth_rates) / len(growth_rates) if growth_rates else 0,
            "seasonality": self._detect_seasonality(revenue_data),
            "revenue_stability": "stable" if all(abs(r) < 20 for r in growth_rates) else "volatile",
            "current_mrr": latest_revenue
        }
    
    def _analyze_dev_patterns(self, dev_data: Dict) -> Dict:
        """Analyze development activity patterns"""
        if not dev_data:
            return {"status": "no_data"}
            
        return {
            "activity_level": self._categorize_activity(dev_data.get('productivity_score', 0)),
            "pr_efficiency": "efficient" if dev_data.get('avg_pr_merge_time', 0) < 2 else "needs_improvement",
            "most_active_day": self._day_name(dev_data.get('most_active_day', 0)),
            "most_active_hour": dev_data.get('most_active_hour', 0),
            "collaboration_style": "active" if dev_data.get('total_prs', 0) > 10 else "passive"
        }
    
    def _analyze_customer_patterns(self, customer_data: Dict) -> Dict:
        """Analyze customer behavior patterns"""
        if not customer_data:
            return {"status": "no_data"}
            
        return {
            "customer_value": self._categorize_ltv(customer_data.get('lifetime_value', 0)),
            "engagement": customer_data.get('engagement_level', 'unknown'),
            "purchase_frequency": "frequent" if customer_data.get('total_invoices', 0) > 10 else "occasional",
            "cross_platform": bool(customer_data.get('stripe_customer_id') and customer_data.get('shopify_customer_id'))
        }
    
    def _analyze_website_patterns(self, website_data: List[Dict]) -> Dict:
        """Analyze website usage patterns"""
        if not website_data:
            return {"status": "no_data"}
            
        avg_users = sum(d['daily_users'] for d in website_data) / len(website_data)
        bounce_rates = [d['bounce_rate'] for d in website_data]
        
        return {
            "traffic_trend": self._detect_trend([d['daily_users'] for d in website_data]),
            "engagement_quality": "high" if sum(bounce_rates) / len(bounce_rates) < 50 else "low",
            "user_retention": "good" if any(d['sessions_per_user'] > 1.5 for d in website_data) else "needs_work",
            "growth_phase": self._categorize_growth(website_data)
        }
    
    async def _generate_ai_insights(self, user_data: Dict, patterns: Dict) -> Dict:
        """Generate AI-powered insights from patterns"""
        
        # Prepare context for AI
        context = {
            "user_type": self._determine_user_type(patterns),
            "key_metrics": self._extract_key_metrics(user_data),
            "patterns": patterns
        }
        
        # Generate insights using OpenAI
        prompt = f"""
        Based on the following user data and patterns, provide actionable insights:
        
        User Type: {context['user_type']}
        Key Metrics: {json.dumps(context['key_metrics'], indent=2)}
        Patterns: {json.dumps(patterns, indent=2)}
        
        Please provide:
        1. Top 3 strengths of this user's workflow
        2. Top 3 areas for improvement
        3. Predicted future behavior
        4. Risk factors to monitor
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a business analyst expert in SaaS metrics, developer workflows, and customer behavior."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        ai_insights = response.choices[0].message.content
        
        return {
            "ai_analysis": ai_insights,
            "user_type": context['user_type'],
            "health_score": self._calculate_health_score(patterns),
            "churn_risk": self._calculate_churn_risk(patterns),
            "growth_potential": self._calculate_growth_potential(patterns)
        }
    
    async def _create_recommendations(self, insights: Dict) -> List[Dict]:
        """Create specific action recommendations"""
        
        recommendations = []
        
        # Revenue recommendations
        if insights['health_score'] < 70:
            recommendations.append({
                "type": "revenue",
                "priority": "high",
                "action": "Schedule customer success call",
                "reason": "Health score below threshold",
                "impact": "Reduce churn risk by 40%"
            })
        
        # Development recommendations
        if insights.get('user_type') == 'developer':
            recommendations.append({
                "type": "development",
                "priority": "medium",
                "action": "Suggest code review automation",
                "reason": "High PR volume detected",
                "impact": "Save 5 hours per week"
            })
        
        # Growth recommendations
        if insights['growth_potential'] > 80:
            recommendations.append({
                "type": "growth",
                "priority": "high", 
                "action": "Offer premium features",
                "reason": "High engagement and growth potential",
                "impact": "Potential 30% revenue increase"
            })
        
        return recommendations
    
    async def _store_analysis(self, user_id: str, insights: Dict, recommendations: List[Dict]):
        """Store analysis results for future reference"""
        
        analysis_record = {
            "user_id": user_id,
            "insights": insights,
            "recommendations": recommendations,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
        }
        
        # Store in analytics table
        self.supabase.table('ai_workflow_analysis') \
            .insert(analysis_record) \
            .execute()
    
    # Helper methods
    def _detect_seasonality(self, revenue_data: List[Dict]) -> str:
        """Detect seasonal patterns in revenue"""
        if len(revenue_data) < 12:
            return "insufficient_data"
        # Implement seasonality detection algorithm
        return "no_seasonality"
    
    def _categorize_activity(self, score: int) -> str:
        if score > 100:
            return "very_active"
        elif score > 50:
            return "active"
        elif score > 20:
            return "moderate"
        else:
            return "low"
    
    def _categorize_ltv(self, ltv: float) -> str:
        if ltv > 10000:
            return "enterprise"
        elif ltv > 1000:
            return "premium"
        elif ltv > 100:
            return "standard"
        else:
            return "basic"
    
    def _day_name(self, day_num: int) -> str:
        days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return days[day_num] if 0 <= day_num <= 6 else 'Unknown'
    
    def _detect_trend(self, values: List[float]) -> str:
        if not values or len(values) < 2:
            return "insufficient_data"
        
        # Simple trend detection
        first_half = sum(values[:len(values)//2]) / (len(values)//2)
        second_half = sum(values[len(values)//2:]) / (len(values) - len(values)//2)
        
        if second_half > first_half * 1.1:
            return "growing"
        elif second_half < first_half * 0.9:
            return "declining"
        else:
            return "stable"
    
    def _categorize_growth(self, website_data: List[Dict]) -> str:
        if not website_data:
            return "no_data"
            
        new_user_ratio = sum(d['new_users'] / d['users'] if d['users'] > 0 else 0 
                           for d in website_data) / len(website_data)
        
        if new_user_ratio > 0.7:
            return "early_stage"
        elif new_user_ratio > 0.3:
            return "growth_stage"
        else:
            return "mature_stage"
    
    def _determine_user_type(self, patterns: Dict) -> str:
        """Determine primary user type based on patterns"""
        dev_score = patterns['development_patterns'].get('productivity_score', 0)
        revenue = patterns['revenue_patterns'].get('current_mrr', 0)
        
        if dev_score > 50 and revenue > 1000:
            return "technical_founder"
        elif dev_score > 50:
            return "developer"
        elif revenue > 5000:
            return "enterprise_customer"
        elif revenue > 500:
            return "business_customer"
        else:
            return "standard_user"
    
    def _extract_key_metrics(self, user_data: Dict) -> Dict:
        """Extract key metrics for AI context"""
        return {
            "lifetime_value": user_data['customer'].get('lifetime_value', 0),
            "total_repos": user_data['developer'].get('total_repos', 0),
            "monthly_revenue": user_data['revenue'][-1]['revenue'] if user_data['revenue'] else 0,
            "avg_daily_users": sum(d['daily_users'] for d in user_data['website'][-7:]) / 7 if user_data['website'] else 0
        }
    
    def _calculate_health_score(self, patterns: Dict) -> int:
        """Calculate overall account health score (0-100)"""
        score = 50  # Base score
        
        # Revenue factors
        if patterns['revenue_patterns'].get('trend') == 'growing':
            score += 20
        elif patterns['revenue_patterns'].get('trend') == 'declining':
            score -= 20
            
        # Engagement factors
        if patterns['customer_patterns'].get('engagement') == 'high':
            score += 15
        elif patterns['customer_patterns'].get('engagement') == 'low':
            score -= 15
            
        # Activity factors
        if patterns['development_patterns'].get('activity_level') in ['active', 'very_active']:
            score += 15
            
        return max(0, min(100, score))
    
    def _calculate_churn_risk(self, patterns: Dict) -> str:
        """Calculate churn risk level"""
        risk_factors = 0
        
        if patterns['revenue_patterns'].get('trend') == 'declining':
            risk_factors += 2
        if patterns['customer_patterns'].get('engagement') == 'low':
            risk_factors += 2
        if patterns['website_patterns'].get('engagement_quality') == 'low':
            risk_factors += 1
            
        if risk_factors >= 4:
            return "high"
        elif risk_factors >= 2:
            return "medium"
        else:
            return "low"
    
    def _calculate_growth_potential(self, patterns: Dict) -> int:
        """Calculate growth potential score (0-100)"""
        score = 50
        
        if patterns['revenue_patterns'].get('trend') == 'growing':
            score += 20
        if patterns['development_patterns'].get('activity_level') == 'very_active':
            score += 20
        if patterns['website_patterns'].get('traffic_trend') == 'growing':
            score += 10
            
        return min(100, score)


# ========================================
# 4. AUTOMATED WORKFLOW EXECUTION
# ========================================

async def run_daily_analysis():
    """Run daily analysis for all active users"""
    
    analyzer = UserWorkflowAnalyzer(
        supabase_url="YOUR_SUPABASE_URL",
        supabase_key="YOUR_SUPABASE_KEY",
        openai_key="YOUR_OPENAI_KEY"
    )
    
    # Get all active users
    active_users = await get_active_users()
    
    # Run analysis for each user
    for user_id in active_users:
        try:
            print(f"Analyzing user {user_id}...")
            results = await analyzer.analyze_user_workflow(user_id)
            
            # Send notifications for high-priority recommendations
            high_priority = [r for r in results['recommendations'] if r['priority'] == 'high']
            if high_priority:
                await send_alert(user_id, high_priority)
                
            print(f"Analysis complete for user {user_id}")
            
        except Exception as e:
            print(f"Error analyzing user {user_id}: {e}")
            continue
    
    print("Daily analysis complete")


async def get_active_users() -> List[str]:
    """Get list of active users to analyze"""
    # Implementation depends on your user management system
    return ["user_123", "user_456", "user_789"]


async def send_alert(user_id: str, recommendations: List[Dict]):
    """Send alert for high-priority recommendations"""
    # Implementation depends on your notification system
    pass


# Schedule daily analysis
if __name__ == "__main__":
    asyncio.run(run_daily_analysis())