'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from './client'
import type { User, Session } from '@supabase/supabase-js'

type SupabaseContext = {
  user: User | null
  session: Session | null
  loading: boolean
}

const Context = createContext<SupabaseContext>({
  user: null,
  session: null,
  loading: true
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Context.Provider value={{ user, session, loading }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}
