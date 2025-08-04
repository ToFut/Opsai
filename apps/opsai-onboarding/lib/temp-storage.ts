// Temporary file-based storage until Supabase tables are created
import fs from 'fs'
import path from 'path'

const STORAGE_DIR = path.join(process.cwd(), '.temp-storage')

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true })
}

export const tempStorage = {
  // Save integration data
  async saveIntegration(data: any) {
    const file = path.join(STORAGE_DIR, `integration_${data.tenant_id}_${data.provider}.json`)
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    console.log(`💾 Saved integration to: ${file}`)
  },

  // Get integration data
  async getIntegration(tenantId: string, provider: string) {
    const file = path.join(STORAGE_DIR, `integration_${tenantId}_${provider}.json`)
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8')
      return JSON.parse(content)
    }
    return null
  },

  // Save sample data
  async saveSampleData(data: any) {
    const file = path.join(STORAGE_DIR, `sample_${data.tenant_id}_${data.provider}.json`)
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    console.log(`💾 Saved sample data to: ${file}`)
    return true
  },

  // Get all sample data for a tenant
  async getSampleDataForTenant(tenantId: string) {
    const files = fs.readdirSync(STORAGE_DIR)
    const sampleFiles = files.filter(f => f.startsWith(`sample_${tenantId}_`))
    
    return sampleFiles.map(file => {
      const content = fs.readFileSync(path.join(STORAGE_DIR, file), 'utf-8')
      return JSON.parse(content)
    })
  },

  // Save schema
  async saveSchema(data: any) {
    const file = path.join(STORAGE_DIR, `schema_${data.tenant_id}.json`)
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    console.log(`💾 Saved schema to: ${file}`)
    return { id: Date.now(), ...data }
  },

  // Save dynamic data
  async saveDynamicData(data: any) {
    const file = path.join(STORAGE_DIR, `dynamic_${data.tenant_id}_${data.entity_type}_${data.entity_id}.json`)
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    return true
  }
}