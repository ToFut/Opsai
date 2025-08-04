import Redis from 'redis'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

// Schema definitions
export const MemoryItemSchema = z.object({
  id: z.string(),
  type: z.enum(['experience', 'pattern', 'skill', 'knowledge', 'insight']),
  content: z.any(),
  importance: z.number().min(0).max(1),
  timestamp: z.string(),
  tags: z.array(z.string()),
  agentId: z.string(),
  context: z.record(z.any()).optional(),
})

export const MemoryQuerySchema = z.object({
  query: z.string(),
  type: z.enum(['experience', 'pattern', 'skill', 'knowledge', 'insight']).optional(),
  agentId: z.string().optional(),
  limit: z.number().default(10),
  minImportance: z.number().min(0).max(1).default(0.1),
})

export type MemoryItem = z.infer<typeof MemoryItemSchema>
export type MemoryQuery = z.infer<typeof MemoryQuerySchema>

export interface MemoryInsight {
  insight: string
  confidence: number
  sources: string[]
  type: 'pattern' | 'correlation' | 'prediction' | 'optimization'
}

export class IntelligentMemorySystem {
  private redis: Redis.RedisClientType
  private llm: ChatOpenAI
  private memoryIndex: Map<string, MemoryItem[]> = new Map()

  constructor(redisClient: Redis.RedisClientType) {
    this.redis = redisClient
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.3
    })
    
    this.loadMemoryIndex()
  }

  /**
   * Store a memory item
   */
  async store(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<string> {
    const memoryItem: MemoryItem = {
      ...item,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    }

    // Validate
    const validatedItem = MemoryItemSchema.parse(memoryItem)

    // Store in Redis
    const key = this.getMemoryKey(validatedItem.agentId, validatedItem.type, validatedItem.id)
    await this.redis.setex(key, this.getTTL(validatedItem.importance), JSON.stringify(validatedItem))

    // Update index
    await this.updateIndex(validatedItem)

    // Extract and store patterns
    await this.extractPatterns(validatedItem)

    return validatedItem.id
  }

  /**
   * Retrieve memories based on query
   */
  async retrieve(query: MemoryQuery): Promise<MemoryItem[]> {
    const validatedQuery = MemoryQuerySchema.parse(query)
    
    // Semantic search using LLM
    const relevantMemories = await this.semanticSearch(validatedQuery)
    
    // Filter by criteria
    let filtered = relevantMemories.filter(item => 
      item.importance >= validatedQuery.minImportance &&
      (!validatedQuery.type || item.type === validatedQuery.type) &&
      (!validatedQuery.agentId || item.agentId === validatedQuery.agentId)
    )

    // Sort by relevance and importance
    filtered.sort((a, b) => b.importance - a.importance)

    return filtered.slice(0, validatedQuery.limit)
  }

  /**
   * Semantic search using embeddings and LLM reasoning
   */
  private async semanticSearch(query: MemoryQuery): Promise<MemoryItem[]> {
    const searchPrompt = `
Find memories relevant to this query: "${query.query}"

Available memory types and recent items:
${await this.getMemorySummary(query.agentId)}

Consider:
1. Direct keyword matches
2. Semantic similarity
3. Contextual relevance
4. Pattern connections

Return the most relevant memory IDs in order of relevance.
`

    try {
      const response = await this.llm.invoke([
        { role: 'system', content: 'You are a memory retrieval system that finds relevant past experiences and knowledge.' },
        { role: 'user', content: searchPrompt }
      ])

      // Parse response and retrieve actual memories
      const relevantIds = this.extractMemoryIds(response.content as string)
      const memories: MemoryItem[] = []

      for (const id of relevantIds) {
        const memory = await this.getMemoryById(id)
        if (memory) memories.push(memory)
      }

      return memories
    } catch (error) {
      console.warn('Semantic search failed, falling back to simple search:', error)
      return await this.simpleSearch(query)
    }
  }

  /**
   * Simple keyword-based search fallback
   */
  private async simpleSearch(query: MemoryQuery): Promise<MemoryItem[]> {
    const allMemories = await this.getAllMemories(query.agentId)
    const queryWords = query.query.toLowerCase().split(' ')

    return allMemories.filter(memory => {
      const content = JSON.stringify(memory.content).toLowerCase()
      const tags = memory.tags.join(' ').toLowerCase()
      
      return queryWords.some(word => 
        content.includes(word) || tags.includes(word)
      )
    })
  }

  /**
   * Extract patterns from new memories
   */
  private async extractPatterns(newMemory: MemoryItem): Promise<void> {
    if (newMemory.type !== 'experience') return

    // Get related memories
    const relatedMemories = await this.retrieve({
      query: JSON.stringify(newMemory.content),
      agentId: newMemory.agentId,
      type: 'experience',
      limit: 20
    })

    if (relatedMemories.length < 5) return

    // Analyze patterns
    const patternPrompt = `
Analyze these related experiences and identify patterns:

New Experience: ${JSON.stringify(newMemory.content)}

Related Experiences:
${relatedMemories.map(m => JSON.stringify(m.content)).join('\n')}

Identify:
1. Common success patterns
2. Failure patterns to avoid
3. Optimization opportunities
4. Predictive insights

Format as JSON:
{
  "patterns": [
    {
      "type": "success|failure|optimization|prediction",
      "description": "pattern description",
      "confidence": 0.0-1.0,
      "examples": ["example1", "example2"]
    }
  ]
}
`

    try {
      const response = await this.llm.invoke([
        { role: 'system', content: 'You are a pattern recognition AI that identifies actionable insights from experiences.' },
        { role: 'user', content: patternPrompt }
      ])

      const patterns = JSON.parse(response.content as string)
      
      // Store patterns as separate memories
      for (const pattern of patterns.patterns) {
        await this.store({
          type: 'pattern',
          content: pattern,
          importance: pattern.confidence,
          tags: ['pattern', pattern.type, newMemory.agentId],
          agentId: newMemory.agentId,
          context: { sourceMemories: relatedMemories.map(m => m.id) }
        })
      }
    } catch (error) {
      console.warn('Pattern extraction failed:', error)
    }
  }

  /**
   * Generate insights from memory analysis
   */
  async generateInsights(agentId: string, context?: string): Promise<MemoryInsight[]> {
    const recentMemories = await this.retrieve({
      query: context || 'recent experiences and patterns',
      agentId,
      limit: 50
    })

    if (recentMemories.length < 10) {
      return [{
        insight: 'Insufficient data for meaningful insights',
        confidence: 0.1,
        sources: [],
        type: 'pattern'
      }]
    }

    const insightPrompt = `
Analyze these memories and generate actionable business insights:

Memories:
${recentMemories.map(m => `${m.type}: ${JSON.stringify(m.content)}`).join('\n')}

Generate insights for:
1. Performance optimization opportunities
2. Success pattern predictions
3. Risk mitigation strategies
4. Growth recommendations

Format as JSON array:
[
  {
    "insight": "specific actionable insight",
    "confidence": 0.0-1.0,
    "sources": ["memory_id1", "memory_id2"],
    "type": "pattern|correlation|prediction|optimization"
  }
]
`

    try {
      const response = await this.llm.invoke([
        { role: 'system', content: 'You are a business intelligence AI that generates actionable insights from data patterns.' },
        { role: 'user', content: insightPrompt }
      ])

      return JSON.parse(response.content as string)
    } catch (error) {
      console.warn('Insight generation failed:', error)
      return [{
        insight: 'Unable to generate insights due to processing error',
        confidence: 0.1,
        sources: [],
        type: 'pattern'
      }]
    }
  }

  /**
   * Consolidate and clean up memories
   */
  async consolidateMemories(agentId: string): Promise<void> {
    const allMemories = await this.getAllMemories(agentId)
    
    // Group similar memories
    const groups = await this.groupSimilarMemories(allMemories)
    
    // Consolidate each group
    for (const group of groups) {
      if (group.length > 1) {
        const consolidated = await this.consolidateGroup(group)
        
        // Store consolidated memory
        await this.store(consolidated)
        
        // Remove old memories
        for (const old of group) {
          await this.deleteMemory(old.id)
        }
      }
    }
  }

  /**
   * Group similar memories together
   */
  private async groupSimilarMemories(memories: MemoryItem[]): Promise<MemoryItem[][]> {
    const groups: MemoryItem[][] = []
    const processed = new Set<string>()

    for (const memory of memories) {
      if (processed.has(memory.id)) continue

      const similarMemories = memories.filter(m => 
        !processed.has(m.id) && 
        m.type === memory.type &&
        this.calculateSimilarity(memory, m) > 0.8
      )

      if (similarMemories.length > 1) {
        groups.push(similarMemories)
        similarMemories.forEach(m => processed.add(m.id))
      }
    }

    return groups
  }

  /**
   * Calculate similarity between two memories
   */
  private calculateSimilarity(mem1: MemoryItem, mem2: MemoryItem): number {
    // Simple similarity based on tags and content
    const tagOverlap = mem1.tags.filter(tag => mem2.tags.includes(tag)).length
    const maxTags = Math.max(mem1.tags.length, mem2.tags.length)
    
    if (maxTags === 0) return 0
    
    return tagOverlap / maxTags
  }

  /**
   * Consolidate a group of similar memories
   */
  private async consolidateGroup(group: MemoryItem[]): Promise<Omit<MemoryItem, 'id' | 'timestamp'>> {
    const consolidationPrompt = `
Consolidate these similar memories into a single, comprehensive memory:

Memories to consolidate:
${group.map(m => JSON.stringify(m.content)).join('\n')}

Create a consolidated version that:
1. Combines all important information
2. Maintains accuracy
3. Reduces redundancy
4. Preserves insights

Return the consolidated content as JSON.
`

    try {
      const response = await this.llm.invoke([
        { role: 'system', content: 'You are a memory consolidation AI that combines similar memories efficiently.' },
        { role: 'user', content: consolidationPrompt }
      ])

      const consolidatedContent = JSON.parse(response.content as string)
      
      return {
        type: group[0].type,
        content: consolidatedContent,
        importance: Math.max(...group.map(m => m.importance)),
        tags: [...new Set(group.flatMap(m => m.tags))],
        agentId: group[0].agentId,
        context: {
          consolidatedFrom: group.map(m => m.id),
          consolidationDate: new Date().toISOString()
        }
      }
    } catch (error) {
      console.warn('Memory consolidation failed:', error)
      return group[0]
    }
  }

  /**
   * Helper methods
   */
  private getMemoryKey(agentId: string, type: string, id: string): string {
    return `memory:${agentId}:${type}:${id}`
  }

  private getTTL(importance: number): number {
    // More important memories last longer
    const baseTTL = 86400 * 7 // 7 days
    return Math.floor(baseTTL * (1 + importance * 4)) // 7-35 days
  }

  private async updateIndex(memory: MemoryItem): Promise<void> {
    const indexKey = `${memory.agentId}:${memory.type}`
    
    if (!this.memoryIndex.has(indexKey)) {
      this.memoryIndex.set(indexKey, [])
    }
    
    this.memoryIndex.get(indexKey)!.push(memory)
    
    // Persist index
    await this.redis.setex(
      `memory:index:${indexKey}`, 
      86400 * 7, 
      JSON.stringify(this.memoryIndex.get(indexKey))
    )
  }

  private async loadMemoryIndex(): Promise<void> {
    try {
      const keys = await this.redis.keys('memory:index:*')
      
      for (const key of keys) {
        const data = await this.redis.get(key)
        if (data) {
          const indexKey = key.replace('memory:index:', '')
          this.memoryIndex.set(indexKey, JSON.parse(data))
        }
      }
    } catch (error) {
      console.warn('Failed to load memory index:', error)
    }
  }

  private async getMemorySummary(agentId?: string): Promise<string> {
    const summary = []
    
    for (const [key, memories] of this.memoryIndex.entries()) {
      if (!agentId || key.startsWith(agentId)) {
        summary.push(`${key}: ${memories.length} items`)
        
        // Add recent items
        const recent = memories.slice(-3)
        for (const memory of recent) {
          summary.push(`  - ${memory.type}: ${JSON.stringify(memory.content).slice(0, 100)}...`)
        }
      }
    }
    
    return summary.join('\n')
  }

  private extractMemoryIds(response: string): string[] {
    // Extract UUIDs from LLM response
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
    return response.match(uuidRegex) || []
  }

  private async getMemoryById(id: string): Promise<MemoryItem | null> {
    try {
      const keys = await this.redis.keys(`memory:*:*:${id}`)
      if (keys.length === 0) return null
      
      const data = await this.redis.get(keys[0])
      return data ? JSON.parse(data) : null
    } catch (error) {
      return null
    }
  }

  private async getAllMemories(agentId?: string): Promise<MemoryItem[]> {
    const allMemories: MemoryItem[] = []
    
    for (const [key, memories] of this.memoryIndex.entries()) {
      if (!agentId || key.startsWith(agentId)) {
        allMemories.push(...memories)
      }
    }
    
    return allMemories
  }

  private async deleteMemory(id: string): Promise<void> {
    const keys = await this.redis.keys(`memory:*:*:${id}`)
    for (const key of keys) {
      await this.redis.del(key)
    }
  }
}