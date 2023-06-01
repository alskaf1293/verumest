import React, { useState, useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router'
import axios from 'axios'
import Sidebar from '../components/Sidebar'
import Application from '@/components/Application'
import YourPosts from '@/components/YourPosts'
import HomeFeed from '@/components/HomeFeed'
import RightSidebar from '@/components/RightSidebar'
import PostSubmission from '@/components/PostSubmission'

export default function Posts({ user, initialPosts, users }: { user: User, initialPosts: any[], users: any[] }) {
  const supabase = useSupabaseClient<Database>()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [posts, setPosts] = useState(initialPosts)
  const router = useRouter()

  const handleNewPost = (post: any) => {
    setPosts([...posts, post])
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
      <Application>
        <Sidebar/>
        <HomeFeed>
          <PostSubmission user={user} onNewPost={handleNewPost} />
          <YourPosts posts={posts} />
        </HomeFeed>
        <RightSidebar/>
      </Application>
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