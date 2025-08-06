import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Storage Configuration for GPT-OSS Models
 * Manages large model files in Supabase Storage
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// Initialize Supabase client with service key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

/**
 * Create storage buckets for GPT-OSS models
 */
export async function initializeModelStorage() {
  try {
    // Create models bucket if it doesn't exist
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    
    const modelsBucket = buckets?.find(b => b.name === 'models')
    
    if (!modelsBucket) {
      const { data, error } = await supabaseAdmin.storage.createBucket('models', {
        public: false,
        fileSizeLimit: 250 * 1024 * 1024 * 1024, // 250GB limit for large models
        allowedMimeTypes: ['application/octet-stream', 'application/json']
      })
      
      if (error) throw error
      console.log('✅ Created models storage bucket')
    } else {
      console.log('ℹ️  Models bucket already exists')
    }

    // Create fine-tuned models bucket
    const fineTunedBucket = buckets?.find(b => b.name === 'fine-tuned-models')
    
    if (!fineTunedBucket) {
      const { data, error } = await supabaseAdmin.storage.createBucket('fine-tuned-models', {
        public: false,
        fileSizeLimit: 250 * 1024 * 1024 * 1024
      })
      
      if (error) throw error
      console.log('✅ Created fine-tuned models storage bucket')
    }

    // Create training data bucket
    const trainingBucket = buckets?.find(b => b.name === 'training-data')
    
    if (!trainingBucket) {
      const { data, error } = await supabaseAdmin.storage.createBucket('training-data', {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024 * 1024 // 10GB limit for training data
      })
      
      if (error) throw error
      console.log('✅ Created training data storage bucket')
    }

    return true
  } catch (error) {
    console.error('Failed to initialize storage:', error)
    return false
  }
}

/**
 * Upload model file to Supabase Storage
 */
export async function uploadModelFile(
  modelName: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<string | null> {
  try {
    const path = `${modelName}/${fileName}`
    
    const { data, error } = await supabaseAdmin.storage
      .from('models')
      .upload(path, fileBuffer, {
        contentType: 'application/octet-stream',
        upsert: true
      })
    
    if (error) throw error
    
    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('models')
      .getPublicUrl(path)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Upload failed:', error)
    return null
  }
}

/**
 * Download model file from Supabase Storage
 */
export async function downloadModelFile(
  modelName: string,
  fileName: string
): Promise<Buffer | null> {
  try {
    const path = `${modelName}/${fileName}`
    
    const { data, error } = await supabaseAdmin.storage
      .from('models')
      .download(path)
    
    if (error) throw error
    
    const buffer = Buffer.from(await data.arrayBuffer())
    return buffer
  } catch (error) {
    console.error('Download failed:', error)
    return null
  }
}

/**
 * List available models in storage
 */
export async function listAvailableModels() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('models')
      .list('', {
        limit: 100,
        offset: 0
      })
    
    if (error) throw error
    
    // Group files by model
    const models: Record<string, any[]> = {}
    
    for (const item of data || []) {
      if (item.name && !item.name.includes('.')) {
        // This is a folder (model)
        const modelFiles = await supabaseAdmin.storage
          .from('models')
          .list(item.name)
        
        models[item.name] = modelFiles.data || []
      }
    }
    
    return models
  } catch (error) {
    console.error('Failed to list models:', error)
    return {}
  }
}

/**
 * Store training data for fine-tuning
 */
export async function storeTrainingData(
  datasetName: string,
  data: any[]
): Promise<boolean> {
  try {
    const jsonlData = data.map(item => JSON.stringify(item)).join('\n')
    const buffer = Buffer.from(jsonlData)
    
    const { error } = await supabaseAdmin.storage
      .from('training-data')
      .upload(`${datasetName}.jsonl`, buffer, {
        contentType: 'application/jsonl',
        upsert: true
      })
    
    if (error) throw error
    
    console.log(`✅ Stored training dataset: ${datasetName}`)
    return true
  } catch (error) {
    console.error('Failed to store training data:', error)
    return false
  }
}

/**
 * Get model metadata from database
 */
export async function getModelMetadata(modelId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_models')
      .select('*')
      .eq('model_id', modelId)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to get model metadata:', error)
    return null
  }
}

/**
 * Update model metadata in database
 */
export async function updateModelMetadata(
  modelId: string,
  metadata: {
    status?: 'downloading' | 'ready' | 'loading' | 'error'
    size_gb?: number
    last_used?: string
    performance_metrics?: any
  }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_models')
      .upsert({
        model_id: modelId,
        ...metadata,
        updated_at: new Date().toISOString()
      })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to update model metadata:', error)
    return null
  }
}