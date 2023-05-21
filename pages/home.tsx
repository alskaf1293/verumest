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
  
    // Fetch all posts
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
  
    if (error) console.log("Error fetching posts:", error)
  
    return {
      props: {
        initialSession: session,
        user: session.user,
        initialPosts: posts,
      },
    }
  }