import { createClient } from '@supabase/supabase-js'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import fetch from 'node-fetch'

interface ModelConfig {
  id: string
  name: string
  size: 'gpt-oss-20b' | 'gpt-oss-120b'
  quantization: 'mxfp4' | 'fp16' | 'int8'
  memoryRequired: number // in GB
  storageRequired: number // in GB
  supabasePath?: string
  localPath?: string
  loaded: boolean
}

interface InferenceRequest {
  prompt: string
  maxTokens?: number
  temperature?: number
  reasoningEffort?: 'low' | 'medium' | 'high'
  stream?: boolean
}

export class GPTOSSManager {
  private supabase: any
  private models: Map<string, ModelConfig>
  private activeModel: ModelConfig | null = null
  private inferenceServer: any = null
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    this.models = new Map([
      ['gpt-oss-20b', {
        id: 'gpt-oss-20b',
        name: 'GPT-OSS 20B',
        size: 'gpt-oss-20b',
        quantization: 'mxfp4',
        memoryRequired: 40,
        storageRequired: 40,
        loaded: false
      }],
      ['gpt-oss-120b', {
        id: 'gpt-oss-120b',
        name: 'GPT-OSS 120B',
        size: 'gpt-oss-120b',
        quantization: 'mxfp4',
        memoryRequired: 240,
        storageRequired: 240,
        loaded: false
      }]
    ])
  }

  /**
   * Download model from Hugging Face and store in Supabase
   */
  async downloadAndStoreModel(modelSize: 'gpt-oss-20b' | 'gpt-oss-120b') {
    const model = this.models.get(modelSize)
    if (!model) throw new Error(`Model ${modelSize} not found`)

    console.log(`📥 Downloading ${modelSize} from Hugging Face...`)
    
    const modelUrl = `https://huggingface.co/openai/${modelSize}/resolve/main`
    const files = [
      'config.json',
      'tokenizer.json',
      'model.safetensors',
      'generation_config.json'
    ]

    const localDir = path.join(process.cwd(), 'models', modelSize)
    await fs.mkdir(localDir, { recursive: true })

    for (const file of files) {
      const url = `${modelUrl}/${file}`
      const localPath = path.join(localDir, file)
      
      // Download file
      const response = await fetch(url)
      const buffer = await response.buffer()
      await fs.writeFile(localPath, buffer)
      
      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('models')
        .upload(`${modelSize}/${file}`, buffer, {
          contentType: 'application/octet-stream',
          upsert: true
        })
      
      if (error) throw error
      console.log(`✅ Uploaded ${file} to Supabase`)
    }

    model.localPath = localDir
    model.supabasePath = `models/${modelSize}`
    
    return model
  }

  /**
   * Load model from Supabase to local storage
   */
  async loadModelFromSupabase(modelSize: 'gpt-oss-20b' | 'gpt-oss-120b') {
    const model = this.models.get(modelSize)
    if (!model) throw new Error(`Model ${modelSize} not found`)

    const localDir = path.join(process.cwd(), 'models', modelSize)
    await fs.mkdir(localDir, { recursive: true })

    const files = ['config.json', 'tokenizer.json', 'model.safetensors', 'generation_config.json']
    
    for (const file of files) {
      const { data, error } = await this.supabase.storage
        .from('models')
        .download(`${modelSize}/${file}`)
      
      if (error) throw error
      
      const buffer = Buffer.from(await data.arrayBuffer())
      await fs.writeFile(path.join(localDir, file), buffer)
    }

    model.localPath = localDir
    model.loaded = true
    
    return model
  }

  /**
   * Start inference server with vLLM
   */
  async startInferenceServer(modelSize: 'gpt-oss-20b' | 'gpt-oss-120b') {
    const model = this.models.get(modelSize)
    if (!model || !model.localPath) {
      throw new Error(`Model ${modelSize} not loaded`)
    }

    // Kill existing server if running
    if (this.inferenceServer) {
      this.inferenceServer.kill()
    }

    // Start vLLM server
    this.inferenceServer = spawn('python', [
      '-m', 'vllm.entrypoints.openai.api_server',
      '--model', model.localPath,
      '--port', '8000',
      '--quantization', 'mxfp4',
      '--max-model-len', '8192',
      '--gpu-memory-utilization', '0.9'
    ])

    this.inferenceServer.stdout.on('data', (data: Buffer) => {
      console.log(`vLLM: ${data}`)
    })

    this.inferenceServer.stderr.on('data', (data: Buffer) => {
      console.error(`vLLM Error: ${data}`)
    })

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    this.activeModel = model
    console.log(`✅ Inference server started for ${modelSize}`)
    
    return true
  }

  /**
   * Run inference using the loaded model
   */
  async inference(request: InferenceRequest): Promise<string> {
    if (!this.activeModel) {
      throw new Error('No model loaded. Call startInferenceServer first.')
    }

    const response = await fetch('http://localhost:8000/v1/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.activeModel.id,
        prompt: request.prompt,
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7,
        stream: request.stream || false
      })
    })

    const data = await response.json()
    return data.choices[0].text
  }

  /**
   * Fine-tune model on custom data
   */
  async fineTuneModel(
    modelSize: 'gpt-oss-20b' | 'gpt-oss-120b',
    trainingData: { input: string; output: string }[]
  ) {
    const model = this.models.get(modelSize)
    if (!model || !model.localPath) {
      throw new Error(`Model ${modelSize} not loaded`)
    }

    // Prepare training data in JSONL format
    const trainingFile = path.join(model.localPath, 'training_data.jsonl')
    const jsonlData = trainingData
      .map(item => JSON.stringify({
        messages: [
          { role: 'user', content: item.input },
          { role: 'assistant', content: item.output }
        ]
      }))
      .join('\n')
    
    await fs.writeFile(trainingFile, jsonlData)

    // Run fine-tuning script
    const finetuneProcess = spawn('python', [
      '-m', 'transformers.trainer',
      '--model_name_or_path', model.localPath,
      '--train_file', trainingFile,
      '--output_dir', `${model.localPath}_finetuned`,
      '--num_train_epochs', '3',
      '--per_device_train_batch_size', '1',
      '--gradient_accumulation_steps', '8',
      '--learning_rate', '1e-5',
      '--warmup_steps', '100',
      '--logging_steps', '10',
      '--save_steps', '100',
      '--evaluation_strategy', 'no',
      '--save_strategy', 'steps',
      '--load_best_model_at_end', 'false'
    ])

    return new Promise((resolve, reject) => {
      finetuneProcess.on('close', (code) => {
        if (code === 0) {
          resolve(`Fine-tuning completed for ${modelSize}`)
        } else {
          reject(new Error(`Fine-tuning failed with code ${code}`))
        }
      })
    })
  }

  /**
   * Switch between models based on task complexity
   */
  async selectOptimalModel(taskComplexity: 'simple' | 'medium' | 'complex'): Promise<ModelConfig> {
    let targetModel: string
    
    switch (taskComplexity) {
      case 'simple':
        targetModel = 'gpt-oss-20b' // Fast, low latency
        break
      case 'medium':
        targetModel = 'gpt-oss-20b' // Balanced
        break
      case 'complex':
        targetModel = 'gpt-oss-120b' // High reasoning
        break
      default:
        targetModel = 'gpt-oss-20b'
    }

    const model = this.models.get(targetModel)
    if (!model) throw new Error(`Model ${targetModel} not found`)

    // Load and start model if not active
    if (this.activeModel?.id !== targetModel) {
      if (!model.loaded) {
        await this.loadModelFromSupabase(targetModel as any)
      }
      await this.startInferenceServer(targetModel as any)
    }

    return model
  }

  /**
   * Get model status and metrics
   */
  getStatus() {
    return {
      models: Array.from(this.models.values()).map(m => ({
        id: m.id,
        name: m.name,
        loaded: m.loaded,
        active: m.id === this.activeModel?.id,
        memoryRequired: m.memoryRequired,
        storageRequired: m.storageRequired
      })),
      activeModel: this.activeModel?.id || null,
      serverRunning: this.inferenceServer !== null
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    if (this.inferenceServer) {
      this.inferenceServer.kill()
      this.inferenceServer = null
    }
    this.activeModel = null
  }
}

// Singleton instance
export const gptOSSManager = new GPTOSSManager()