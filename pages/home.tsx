import React, { useState, useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import { GetServerSidePropsContext } from 'next'

export default function Home({ user, initialPosts }: { user: User, initialPosts: any[] }) {
  const supabase = useSupabaseClient<Database>()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [posts, setPosts] = useState(initialPosts)

  const handlePostSubmit = async () => {
    // Insert post into the database
    const { data: post, error } = await supabase
      .from('posts')
      .insert([{ title, content, user_id: user.id }])
  
    if (error) {
      console.log("Error creating post:", error)
    } else if (post) {
      // If a post was inserted successfully, post[0] will contain the new post.
      console.log(post[0])
      setPosts([...posts, post[0]])
    }
  }
  //handlePostSubmit
  return (
    <>
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ textAlign: 'center' }}>HOME PAGE</h1>
        <div style={{ marginBottom: '2rem' }}>
          <h2>Create Post</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            style={{ display: 'block', width: '100%', padding: '0.5rem' }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Content"
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '1rem' }}
          />
          <button
            onClick={handlePostSubmit}
            style={{ display: 'block', margin: '1rem auto', padding: '1rem', backgroundColor: '#0070f3', color: '#fff', cursor: 'pointer' }}
          >
            Submit Post
          </button>
        </div>

        <h2>Your Posts</h2>
        {posts.filter(Boolean).map((post) => (
          <div key={post.id} style={{ marginBottom: '2rem', border: '1px solid #ddd', padding: '1rem' }}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
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

  if (!session)
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }

  // Fetch user's posts
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', session.user.id)

  if (error) console.log("Error fetching posts:", error)

  return {
    props: {
      initialSession: session,
      user: session.user,
      initialPosts: posts,
    },
  }
}