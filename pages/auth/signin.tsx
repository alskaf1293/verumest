import React, { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Database } from '../../types/database'
import { useRouter } from 'next/router'

export default function SignIn() {
  const router = useRouter()
  const supabase = useSupabaseClient<Database>()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [errorMsg, setErrorMsg] = useState('')

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }

  const loginHandler = async () => {
    console.log('loggin in with - email:', email, '| password:', password)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
    console.log('results of logging in: ', data, error)
    if (!error) {
      router.push('/home')
    } else {
      setErrorMsg(error.message)
    }
  }

  const loginGoogleHandler = async () => {
    console.log('loggin in with google')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${new URL(location.href).origin}/logging-in?redirect=/posts`,
      },
    })
    console.log('results of logging in: ', data, error)
  }

  return (
    <>
      <div className='h-screen grid place-items-center'>
        <div className='flex flex-col border-2 p-4 gap-4 py-4'>
          <h1 className='text-3xl font-bold underline'>Login Form</h1>
          <input
            type='email'
            value={email}
            onChange={onEmailChange}
            placeholder='email'
            className='border-2 p-4'
          />
          <input
            type='password'
            value={password}
            onChange={onPasswordChange}
            placeholder='password'
            className='border-2 p-4'
          />
          <button onClick={loginHandler} className='border-2 p-4'>
            Login
          </button>
          <button onClick={loginGoogleHandler} className='border-2 p-4'>
            Google Login
          </button>
          <p className='text-red-400'>{errorMsg}</p>
        </div>
      </div>
    </>
  )
}
