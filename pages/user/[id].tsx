// pages/user/[id].tsx

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { GetServerSidePropsContext } from 'next'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'

type UserProfileProps = {
  id: string;
  created_at: string;
  user_id: string;
  location: string;
  first_visit: boolean;
};

type Props = {
  initialUser: UserProfileProps;
  initialProfile: UserProfileProps;
};

export default function UserProfile({ initialUser, initialProfile }: Props) {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState<UserProfileProps | null>(initialProfile)
  const [currentUser, setCurrentUser] = useState<UserProfileProps | null>(initialUser)
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (id) {
      fetchUser(id as string)
    }
  }, [id])

  const sendChatRequest = async () => {
    const { data, error } = await supabase
      .from('chat_requests')
      .insert([
        { sender_id: currentUser!.user_id, receiver_id: user!.user_id, message : message, status: 'pending' },
      ])

    if (error) {
      console.error('Error sending chat request:', error)
      return
    }

    // Clear the message input after sending the request
    setMessage('')
  }

  const fetchUser = async (id: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return
    }

    setUser(data as UserProfileProps)
  }

  if (!user || !currentUser) {
    return <div>Loading...</div>
  }

  if (user.location !== currentUser.location) {
    return <div>You are not in the same network as this user.</div>
  }

  return (
    <div>
      <h1>{user.user_id}'s Profile</h1>
      {/* Display other user info here */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your chat request message here"
      />
      <button onClick={sendChatRequest}>Send Chat Request</button>
    </div>
  )
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient(ctx);

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // Fetch the current user
  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  if (userError) {
    console.error('Error fetching user:', userError)
    // Handle error appropriately
  }

  // Fetch the profile of the user whose id is in the URL
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', ctx!.params!.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    // Handle error appropriately
  }

  return {
    props: {
      initialUser: user,
      initialProfile: profile,
    },
  };
}