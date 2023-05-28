import React, { useState, useEffect } from 'react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { GetServerSidePropsContext } from 'next'

function cosineSimilarity(a: number[], b: number[]): number {
  const dotproduct = a.reduce((sum, a_i, i) => sum + a_i * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, a_i) => sum + a_i * a_i, 0));
  const magB = Math.sqrt(b.reduce((sum, b_i) => sum + b_i * b_i, 0));
  
  if ((magA * magB) === 0) {
    throw new Error("The magnitude of one of the vectors is zero.");
  }
  
  return dotproduct / (magA * magB); 
}

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

  // Fetch chat history embedding for the current user
  const { data: chatHistory, error: chatHistoryError } = await supabase
    .from('chat_embeddings')
    .select('embedding')
    .eq('user_id', session.user.id);

  if (chatHistoryError) {
    console.log("Error fetching chat history:", chatHistoryError);
    // Handle error appropriately
  }

  if (!chatHistory || chatHistory.length === 0) {
    console.log("Chat history not found or no embedding defined");
    // Handle the error appropriately, you might want to return or throw an error
  }

  const userEmbedding = chatHistory![0].embedding;

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
    const similarity = cosineSimilarity(userEmbedding, postEmbedding);
    console.log(post.content)
    console.log(similarity)
    return similarity >= 0.7;
  });

  return {
    props: {
      initialSession: session,
      user: session.user,
      initialPosts: filteredPosts,
    },
  };
};