import React, { useState, useEffect } from 'react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { GetServerSidePropsContext } from 'next'
import Sidebar from '../components/Sidebar'
import Application from '../components/Application'
import HomeFeed from '@/components/HomeFeed'
import RightSidebar from '@/components/RightSidebar'
import { supabase } from '../utils/supabaseClient'

export default function Settings({ user }: { user: User }) {
  const [location, setLocation] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`location, name`)
      .eq('user_id', user.id)
      .single();

    if (data) {
      setLocation(data.location);
      setName(data.name || '');
    }
    setLoading(false);
  }

  const updateProfile = async () => {
    await supabase
      .from('user_profiles')
      .update({ name })
      .eq('user_id', user.id);

    alert("Profile updated!");
  }

  return (
    <Application>
      <Sidebar />
      <RightSidebar />
      <HomeFeed>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div>
            <h1>User Profile</h1>
            <p>User ID: {user.id}</p>
            <label>
              Name:
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                style={{color: "black"}}
              />
            </label>
            <button onClick={updateProfile}>Update Profile</button>
          </div>
        )}
      </HomeFeed>
      <RightSidebar />
    </Application>
  )
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
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
  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  };
};