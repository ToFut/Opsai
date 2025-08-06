#!/bin/bash

# GPT-OSS Setup Script for OpsAI Platform
# This script sets up the GPT-OSS models with Supabase storage

set -e

echo "🚀 GPT-OSS Setup for OpsAI Platform"
echo "===================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Please install Python 3.8+"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Please install Node.js 18+"
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements-gpt-oss.txt

# Install vLLM for inference
echo "🔧 Installing vLLM inference server..."
pip3 install vllm

# Install Transformers for fine-tuning
echo "🔧 Installing Transformers..."
pip3 install transformers datasets accelerate

# Create model directories
echo "📁 Creating model directories..."
mkdir -p models/gpt-oss-20b
mkdir -p models/gpt-oss-120b
mkdir -p models/fine-tuned

# Set up environment variables
echo "🔐 Setting up environment variables..."
if [ ! -f .env.local ]; then
    cat > .env.local << EOF
# GPT-OSS Configuration
USE_LOCAL_MODELS=true
GPT_OSS_MODEL_PATH=./models
VLLM_PORT=8000
INFERENCE_TIMEOUT=60000

# Model Selection
DEFAULT_MODEL_SIZE=gpt-oss-20b
COMPLEX_TASK_MODEL=gpt-oss-120b

# Supabase Configuration (for model storage)
SUPABASE_SERVICE_KEY=your_service_key_here

# Fallback Configuration
USE_OPENAI_FALLBACK=true
OPENAI_API_KEY=your_openai_key_here
EOF
    echo "✅ Created .env.local - Please update with your API keys"
else
    echo "ℹ️  .env.local already exists"
fi

# Download models (optional - requires Hugging Face login)
read -p "Do you want to download GPT-OSS models now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔐 Please log in to Hugging Face..."
    huggingface-cli login
    
    echo "📥 Downloading GPT-OSS-20B model..."
    huggingface-cli download openai/gpt-oss-20b --local-dir ./models/gpt-oss-20b
    
    read -p "Download the larger 120B model? (requires ~240GB) (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📥 Downloading GPT-OSS-120B model..."
        huggingface-cli download openai/gpt-oss-120b --local-dir ./models/gpt-oss-120b
    fi
fi

# Create systemd service for inference server (Linux only)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🔧 Creating systemd service..."
    sudo cat > /etc/systemd/system/gpt-oss-inference.service << EOF
[Unit]
Description=GPT-OSS Inference Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/python3 -m vllm.entrypoints.openai.api_server --model ./models/gpt-oss-20b --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    echo "✅ Systemd service created. Start with: sudo systemctl start gpt-oss-inference"
fi

# Create test script
echo "🧪 Creating test script..."
cat > test-gpt-oss.js << 'EOF'
// Test GPT-OSS Integration
const testGPTOSS = async () => {
  try {
    // Test model status
    const statusRes = await fetch('http://localhost:3000/api/gpt-oss/status')
    const status = await statusRes.json()
    console.log('Model Status:', status)
    
    // Test inference
    const inferenceRes = await fetch('http://localhost:3000/api/gpt-oss/inference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'analyze',
        prompt: 'What is the capital of France?',
        complexity: 'simple'
      })
    })
    const result = await inferenceRes.json()
    console.log('Inference Result:', result)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testGPTOSS()
EOF

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env.local with your API keys"
echo "2. Start the inference server: npm run start:inference"
echo "3. Test the integration: node test-gpt-oss.js"
echo "4. Update your API routes to use the new AI adapter"
echo ""
echo "📚 Documentation: See README-GPT-OSS.md for detailed usage"