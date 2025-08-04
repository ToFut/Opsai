-- ========================================
-- 2. DATABASE ORGANIZATION AFTER AIRBYTE
-- ========================================

-- Create organized views for each user's data
-- This runs AFTER Airbyte creates the raw tables

-- User Analysis Schema
CREATE SCHEMA IF NOT EXISTS analytics;

-- Unified Customer View
CREATE OR REPLACE VIEW analytics.unified_customers AS
SELECT 
    u.user_id,
    u.email,
    -- Stripe Data
    sc.id as stripe_customer_id,
    sc.created as stripe_created,
    sc.currency as preferred_currency,
    COUNT(DISTINCT si.id) as total_invoices,
    SUM(si.amount_paid) / 100 as lifetime_value,
    
    -- Shopify Data  
    shc.id as shopify_customer_id,
    shc.total_spent as shopify_spent,
    shc.orders_count as order_count,
    
    -- Activity Score
    CASE 
        WHEN COUNT(DISTINCT si.id) > 10 THEN 'high'
        WHEN COUNT(DISTINCT si.id) > 5 THEN 'medium'
        ELSE 'low'
    END as engagement_level
    
FROM users u
LEFT JOIN user_123.stripe_customers sc ON u.email = sc.email
LEFT JOIN user_123.stripe_invoices si ON sc.id = si.customer
LEFT JOIN user_123.shopify_customers shc ON u.email = shc.email
GROUP BY u.user_id, u.email, sc.id, sc.created, sc.currency, shc.id, shc.total_spent, shc.orders_count;

-- Developer Activity View
CREATE OR REPLACE VIEW analytics.developer_activity AS
SELECT
    u.user_id,
    -- GitHub Activity
    COUNT(DISTINCT gr.id) as total_repos,
    COUNT(DISTINCT gi.id) as total_issues,
    COUNT(DISTINCT gpr.id) as total_prs,
    AVG(gpr.merged_at - gpr.created_at) as avg_pr_merge_time,
    
    -- Activity Patterns
    EXTRACT(DOW FROM gi.created_at) as most_active_day,
    EXTRACT(HOUR FROM gi.created_at) as most_active_hour,
    
    -- Productivity Score
    (COUNT(DISTINCT gpr.id) * 10 + COUNT(DISTINCT gi.id) * 5) as productivity_score
    
FROM users u
LEFT JOIN user_123.github_repositories gr ON gr.owner->>'login' = u.github_username
LEFT JOIN user_123.github_issues gi ON gi.user->>'login' = u.github_username  
LEFT JOIN user_123.github_pull_requests gpr ON gpr.user->>'login' = u.github_username
GROUP BY u.user_id;

-- Revenue Analytics View
CREATE OR REPLACE VIEW analytics.revenue_analytics AS
SELECT
    DATE_TRUNC('month', s.created) as month,
    u.user_id,
    COUNT(DISTINCT s.id) as transaction_count,
    SUM(s.amount) / 100 as revenue,
    AVG(s.amount) / 100 as avg_transaction_size,
    
    -- Trend Analysis
    LAG(SUM(s.amount) / 100) OVER (PARTITION BY u.user_id ORDER BY DATE_TRUNC('month', s.created)) as previous_month_revenue,
    (SUM(s.amount) / 100 - LAG(SUM(s.amount) / 100) OVER (PARTITION BY u.user_id ORDER BY DATE_TRUNC('month', s.created))) / 
        NULLIF(LAG(SUM(s.amount) / 100) OVER (PARTITION BY u.user_id ORDER BY DATE_TRUNC('month', s.created)), 0) * 100 as growth_rate
        
FROM users u
JOIN user_123.stripe_charges s ON s.customer IN (
    SELECT id FROM user_123.stripe_customers WHERE email = u.email
)
WHERE s.status = 'succeeded'
GROUP BY DATE_TRUNC('month', s.created), u.user_id;

-- Website Analytics View
CREATE OR REPLACE VIEW analytics.website_analytics AS
SELECT
    u.user_id,
    ga.ga_date as date,
    ga.users as daily_users,
    ga.new_users,
    ga.sessions,
    ga.bounce_rate,
    ga.avg_session_duration,
    
    -- Engagement Metrics
    ga.sessions / NULLIF(ga.users, 0) as sessions_per_user,
    ga.page_views / NULLIF(ga.sessions, 0) as pages_per_session,
    
    -- Trends
    AVG(ga.users) OVER (PARTITION BY u.user_id ORDER BY ga.ga_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as weekly_avg_users
    
FROM users u
JOIN user_123.ga_website_overview ga ON ga.property_id = u.ga_property_id
ORDER BY ga.ga_date DESC;

-- Create indexes for performance
CREATE INDEX idx_stripe_customer_email ON user_123.stripe_customers(email);
CREATE INDEX idx_github_repo_owner ON user_123.github_repositories((owner->>'login'));
CREATE INDEX idx_ga_date ON user_123.ga_website_overview(ga_date);

-- Materialized view for dashboard performance
CREATE MATERIALIZED VIEW analytics.user_dashboard_summary AS
SELECT
    u.user_id,
    u.email,
    -- Revenue Summary
    COALESCE(SUM(si.amount_paid) / 100, 0) as total_revenue,
    COUNT(DISTINCT si.id) as total_transactions,
    
    -- Developer Activity
    COUNT(DISTINCT gr.id) as github_repos,
    COUNT(DISTINCT gpr.id) as github_prs,
    
    -- Website Metrics
    AVG(ga.users) as avg_daily_users,
    AVG(ga.bounce_rate) as avg_bounce_rate,
    
    -- Last Updated
    NOW() as last_refreshed
    
FROM users u
LEFT JOIN user_123.stripe_customers sc ON u.email = sc.email
LEFT JOIN user_123.stripe_invoices si ON sc.id = si.customer
LEFT JOIN user_123.github_repositories gr ON gr.owner->>'login' = u.github_username
LEFT JOIN user_123.github_pull_requests gpr ON gpr.user->>'login' = u.github_username
LEFT JOIN user_123.ga_website_overview ga ON ga.property_id = u.ga_property_id
GROUP BY u.user_id, u.email;

-- Refresh materialized view every hour
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.user_dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh
SELECT cron.schedule('refresh-dashboard', '0 * * * *', 'SELECT refresh_dashboard_summary();');