import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({ user: session.user })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    switch (action) {
      case 'signin':
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        })
        
        if (signInError) {
          return NextResponse.json({ error: signInError.message }, { status: 400 })
        }
        
        return NextResponse.json({ user: signInData.user, session: signInData.session })

      case 'signup':
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName
            }
          }
        })
        
        if (signUpError) {
          return NextResponse.json({ error: signUpError.message }, { status: 400 })
        }
        
        return NextResponse.json({ user: signUpData.user, session: signUpData.session })

      case 'signout':
        const { error: signOutError } = await supabase.auth.signOut()
        
        if (signOutError) {
          return NextResponse.json({ error: signOutError.message }, { status: 400 })
        }
        
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 