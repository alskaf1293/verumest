// got from: https://stackoverflow.com/questions/72385641/supabase-onauthstatechanged-how-do-i-properly-wait-for-the-request-to-finish-p
import React, { createContext, useContext, useEffect, useState } from 'react'

import { Session, User } from '@supabase/auth-helpers-nextjs'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'

export const AuthContext = createContext<{
  user: User | null
  session: Session | null
}>({
  user: null,
  session: null,
})

const AuthContextProvider = (props: any) => {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const [userSession, setUserSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session)
      setUser(session?.user ?? null)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Supabase auth event: ${event}`)
        setUserSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          router.push('/home')
        }
      }
    )

    return () => {
      authListener.subscription
    }
  }, [])

  const value = {
    userSession,
    user,
  }
  return <AuthContext.Provider value={value} {...props} />
}

export default AuthContextProvider

// export const useUser = () => {
//   const context = useContext(AuthContext)
//   if (context === undefined) {
//     throw new Error('useUser must be used within a AuthContextProvider.')
//   }
//   return context
// }
