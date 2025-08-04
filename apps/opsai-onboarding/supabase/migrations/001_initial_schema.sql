-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  website_url TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Code generations table
CREATE TABLE IF NOT EXISTS code_generations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  generated_code JSONB,
  files_affected JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customizations table
CREATE TABLE IF NOT EXISTS customizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  changes JSONB,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  severity VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  uptime_percentage DECIMAL(5,2),
  response_time_ms INTEGER,
  error_rate DECIMAL(5,2),
  requests_per_minute INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Security scores table
CREATE TABLE IF NOT EXISTS security_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  vulnerabilities_count INTEGER DEFAULT 0,
  last_scan_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Code quality table
CREATE TABLE IF NOT EXISTS code_quality (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  maintainability_score INTEGER CHECK (maintainability_score >= 0 AND maintainability_score <= 100),
  complexity_score INTEGER CHECK (complexity_score >= 0 AND complexity_score <= 100),
  test_coverage DECIMAL(5,2),
  lint_errors INTEGER DEFAULT 0,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_code_generations_application_id ON code_generations(application_id);
CREATE INDEX idx_customizations_application_id ON customizations(application_id);
CREATE INDEX idx_ai_insights_application_id ON ai_insights(application_id);
CREATE INDEX idx_performance_metrics_application_id ON performance_metrics(application_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to applications table
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_quality ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Applications: Users can only see and modify their own applications
CREATE POLICY "Users can view their own applications" ON applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" ON applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" ON applications
  FOR DELETE USING (auth.uid() = user_id);

-- Code Generations: Users can only see generations for their applications
CREATE POLICY "Users can view their code generations" ON code_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create code generations" ON code_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Customizations: Users can only see customizations for their applications
CREATE POLICY "Users can view their customizations" ON customizations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create customizations" ON customizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Insights: Users can only see insights for their applications
CREATE POLICY "Users can view their AI insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI insights" ON ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Performance Metrics: Users can only see metrics for their applications
CREATE POLICY "Users can view performance metrics" ON performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = performance_metrics.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- Security Scores: Users can only see scores for their applications
CREATE POLICY "Users can view security scores" ON security_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = security_scores.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- Code Quality: Users can only see quality metrics for their applications
CREATE POLICY "Users can view code quality" ON code_quality
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = code_quality.application_id 
      AND applications.user_id = auth.uid()
    )
  );