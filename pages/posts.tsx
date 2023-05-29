import React, { useState, useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router'
import axios from 'axios'

export default function Posts({ user, initialPosts, users }: { user: User, initialPosts: any[], users: any[] }) {
  const supabase = useSupabaseClient<Database>()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [posts, setPosts] = useState(initialPosts)
  const router = useRouter()
  console.log(user, initialPosts, users)

  const handlePostSubmit = async () => {
    // Insert post into the database
    const newPost = { title, content, user_id: user.id}
    const { data: data, error } = await supabase
      .from('posts')
      .insert([newPost])
      .select()

    if (error) {
      console.log("Error creating post:", error)
    } else if (data) {
      const post = data[0]
      console.log(post)
      // If a post was inserted successfully, post[0] will contain the new post.
      setPosts([...posts, post])
      // Redirect to home page
      //router.push('/home')
    }
  }

  useEffect(() => {
    const submitEmbeddings = async () => {
      if (posts.length > initialPosts.length) {
        const latestPost = posts[posts.length - 1];
        const prompt = latestPost.title + ": " + latestPost.content; 
        const latestId = latestPost.id;
        try {
          const response = await axios.post(
            'https://api.openai.com/v1/embeddings',
            {
              model: 'text-embedding-ada-002',
              input: prompt,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
              },
            }
          );
  
          const embedding = response.data.data[0].embedding; // hypothetical response format
  
          // Update the 'embeddings' column in the database for the latest post
          const { data, error } = await supabase
            .from('posts')
            .update({ embedding: embedding })
            .eq('id', latestId);
  
          if (error) {
            console.log("Error updating post embeddings:", error);
          } else {
            console.log("Embeddings updated successfully");
          }
  
        } catch (error) {
          console.log('Error calling Embeddings API:', error);
        }
      }
    };
    submitEmbeddings();
  }, [posts]);


  return (
    <>
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ textAlign: 'center' }}>POST SOMETHING</h1>
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
            {post.viewed_by && (
              <p>Viewed by: {
                post.viewed_by?.map((userId: string) => {
                  return userId;
                }).join(', ')
              }</p>
            )}
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

  // Fetch all users
  const { data: users } = await supabase
    .from('users')
    .select('*')

  if (error) console.log("Error fetching posts:", error)

  return {
    props: {
      initialSession: session,
      user: session.user,
      initialPosts: posts,
      users: users,   // Pass users to the component
    },
  }
}