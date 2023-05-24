import React, { useState, useEffect } from 'react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { GetServerSidePropsContext } from 'next'

export default function Home({ initialPosts }: { initialPosts: any[] }) {
  const [posts, setPosts] = useState(initialPosts)

  return (
    <>
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ textAlign: 'center' }}>YOUR FEED</h1>

        <h2>Posts</h2>
        {posts.filter(Boolean).map((post) => (
          <div key={post.id} style={{ marginBottom: '2rem', border: '1px solid #ddd', padding: '1rem' }}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <p>Posted by: {post.user_id}</p>
          </div>
        ))}
      </div>
    </>
  )
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient(ctx)

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  // Fetch user profile to get the current user's location
  const { data: userProfile, error: userProfileError } = await supabase
  .from('user_profiles')
  .select('user_id, location')
  .eq('user_id', session.user.id)

  if (userProfileError) {
  console.log("Error fetching user profile:", userProfileError)
  // Handle error appropriately
  }

  if (!userProfile || userProfile.length === 0) {
  console.log("User profile not found or no location defined");
  // Handle the error appropriately, you might want to return or throw an error
  }


  console.log(userProfile)
  const userLocation = userProfile![0].location;

  // Fetch user profiles with the same location
  const { data: sameLocationProfiles, error: sameLocationProfilesError } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('location', userLocation)

  if (sameLocationProfilesError) {
    console.log("Error fetching same location profiles:", sameLocationProfilesError)
    // Handle error appropriately
  }

  // Extract user ids into an array
  const sameLocationUserIds = sameLocationProfiles!.map(profile => profile.user_id)
  
  // Fetch posts from users with the same location
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .in('user_id', sameLocationUserIds)

  if (postsError) {
    console.log("Error fetching posts:", postsError)
    // Handle error appropriately
  }

  return {
    props: {
      initialSession: session,
      user: session.user,
      initialPosts: posts,
    },
  }
}