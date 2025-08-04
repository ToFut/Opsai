import { useEffect, useRef, useState } from 'react'

interface AgentUpdate {
  task_id: string
  agent: string
  status: 'started' | 'progress' | 'completed' | 'error'
  progress?: number
  message?: string
  result?: any
}

interface UseAgentWebSocketOptions {
  onUpdate?: (update: AgentUpdate) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

export function useAgentWebSocket(options: UseAgentWebSocketOptions = {}) {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [updates, setUpdates] = useState<AgentUpdate[]>([])
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)

  const connect = () => {
    const wsUrl = process.env.NEXT_PUBLIC_AGENT_WS_URL || 'ws://localhost:8000/ws'
    
    try {
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        setIsConnected(true)
        options.onConnect?.()
        console.log('Connected to agent service')
      }

      ws.current.onmessage = (event) => {
        try {
          const update: AgentUpdate = JSON.parse(event.data)
          setUpdates(prev => [...prev, update])
          options.onUpdate?.(update)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        options.onError?.(new Error('WebSocket connection error'))
      }

      ws.current.onclose = () => {
        setIsConnected(false)
        options.onDisconnect?.()
        console.log('Disconnected from agent service')
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(() => {
          console.log('Attempting to reconnect...')
          connect()
        }, 5000)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      options.onError?.(error as Error)
    }
  }

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
    
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
  }

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected')
    }
  }

  const clearUpdates = () => {
    setUpdates([])
  }

  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [])

  return {
    isConnected,
    updates,
    sendMessage,
    clearUpdates,
    reconnect: connect,
    disconnect
  }
}