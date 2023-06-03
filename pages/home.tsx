import React, { useState, useEffect } from 'react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { GetServerSidePropsContext } from 'next'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../utils/supabaseClient.js'
import Sidebar from '../components/Sidebar'
import Application from '../components/Application'
import HomeFeed from '@/components/HomeFeed'
import RightSidebar from '@/components/RightSidebar'
import Post from '../components/Post';

function cosineSimilarity(a: number[], b: number[]): number {
  const dotproduct = a.reduce((sum, a_i, i) => sum + a_i * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, a_i) => sum + a_i * a_i, 0));
  const magB = Math.sqrt(b.reduce((sum, b_i) => sum + b_i * b_i, 0));
  
  if ((magA * magB) === 0) {
    throw new Error("The magnitude of one of the vectors is zero.");
  }
  
  return dotproduct / (magA * magB); 
}

type PostType = {
  id: string;
  title: string;
  content: string;
  user_id: string;
  viewed_by: string[];
};

export default function Home({ initialPosts, user }: { initialPosts: PostType[], user: User }) {
  const [posts, setPosts] = useState(initialPosts)

  return (
    <Application>
      <Sidebar /> {/* Add Sidebar component here */}
      <RightSidebar />
      <HomeFeed>
        {posts.filter(Boolean).map((post) => (
          <Post key={post.id} post={post} user={user} />   // Add a key prop here
        ))}
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

  // Fetch chat history embeddings for the current user
  // Only fetch the most recent 250 chat embeddings
  const { data: chatHistory, error: chatHistoryError } = await supabase
    .from('chat_embeddings')
    .select('embedding')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(250);

  if (chatHistoryError) {
    console.log("Error fetching chat history:", chatHistoryError);
    // Handle error appropriately
  }

  if (!chatHistory || chatHistory.length === 0) {
    console.log("Chat history not found or no embedding defined");
    // Handle the error appropriately, you might want to return or throw an error
  }

  const userEmbeddings = chatHistory!.map(chat => chat.embedding);

  // Fetch all posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*');

  if (postsError) {
    console.log("Error fetching posts:", postsError);
    // Handle error appropriately
  }

  // Filter posts based on cosine similarity of embeddings
  const filteredPosts = posts!.filter((post) => {
    const postEmbedding = post.embedding;
    
    for (const userEmbedding of userEmbeddings) {
      const similarity = cosineSimilarity(userEmbedding, postEmbedding);
      console.log(post.content)
      console.log(similarity)
      if (similarity >= 0.8) {
        return true;
      }
    }
    
    return false;
  });

  return {
    props: {
      initialSession: session,
      user: session.user,
      initialPosts: filteredPosts,
    },
  };
};