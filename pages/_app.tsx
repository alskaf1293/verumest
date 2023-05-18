import '@/styles/globals.css'
import type { AppProps } from 'next/app'

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider, Session } from '@supabase/auth-helpers-react'
import { Database } from '../types/database'
import { useState } from 'react'
import AuthContextProvider from '@/context/AuthContext'

export default function App({
  Component,
  pageProps,
}: AppProps<{
  initialSession: Session
}>) {
  // Create a new supabase browser client on every first render.
  const [supabaseClient] = useState(() =>
    createBrowserSupabaseClient<Database>()
  )

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      {/* <AuthContextProvider> */}
      <Component {...pageProps} />
      {/* </AuthContextProvider> */}
    </SessionContextProvider>
  )
}
