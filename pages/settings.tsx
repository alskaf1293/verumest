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
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const uploadProfilePicture = async (event: any) => {
    const file = event.target.files[0];
    const filePath = `${user.id}/profile_picture.${file.name.split('.').pop()}`;

    try {
        const { error: uploadError } = await supabase.storage.from('profile-pictures').upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

    } catch (error) {
        if (error instanceof Error) {
            console.log('Error uploading: ', error.message);
        } else {
            console.log('An unknown error occurred while getting picture URL');
        }
        return;
    }
    
    let publicURL = '';

    try {
        const { data} = await supabase.storage.from('profile-pictures').getPublicUrl(filePath);

        publicURL = data.publicUrl;
    } catch (error) {
        if (error instanceof Error) {
            console.log('Error getting picture URL: ', error.message);
        } else {
            console.log('An unknown error occurred while getting picture URL');
        }
        return;
    }

    // Update the user profile with the URL of the uploaded picture
    try {
        const { error } = await supabase.from('user_profiles').update({ profile_picture_url: publicURL }).eq('user_id', user.id);
        if (error) {
            throw error;
        }
        // Update the state with the new picture URL
        setProfilePictureUrl(publicURL);
    } catch (error) {
        if (error instanceof Error) {
            console.log('Error updating profile: ', error.message);
        } else {
            console.log('An unknown error occurred while updating profile');
        }
    }
  }

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`location, name, profile_picture_url`)
      .eq('user_id', user.id)
      .single();
  
    if (data) {
      setLocation(data.location);
      setName(data.name || '');
      setProfilePictureUrl(data.profile_picture_url || '');
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
            <p>Location: {location}</p>
            <label>
              Name:
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                style={{color: "black"}}
              />
            </label>
            <img src={profilePictureUrl} alt="Profile Picture" />
            <input type="file" accept="image/*" onChange={uploadProfilePicture} />
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