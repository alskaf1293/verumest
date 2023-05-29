import React, { useState, useEffect } from 'react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { GetServerSidePropsContext } from 'next'
import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabaseClient.js'

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

type CommentType = {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
};

function Post({ post, user }: { post: PostType, user: User }) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('')

  useEffect(() => {
    const fetchComments = async () => {
      const { data: fetchedComments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id);
      
      if (error) {
        console.error('There was an error fetching the comments', error);
      } else {
        setComments(fetchedComments as CommentType[]);
      }
    };
  
    const updateViewedBy = async () => {
      // Check if the post has been viewed by the user
      if (!post.viewed_by?.includes(user.id)) {
        try {
          const { error } = await supabase
            .from('posts')
            .update({
              viewed_by: [...(post.viewed_by || []), user.id]
            })
            .eq('id', post.id);
  
          if (error) {
            throw error;
          }
        } catch (error) {
          console.log("Error updating post viewed_by:", error);
        }
      }
    };
  
    fetchComments();
    updateViewedBy();
  }, [post.id]);
  useEffect(() => {
    const fetchComments = async () => {
      const { data: fetchedComments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id);
      
      if (error) {
        console.error('There was an error fetching the comments', error);
      } else {
        setComments(fetchedComments as CommentType[]);
      }
    };
  
    fetchComments();
  }, [post.id]);
  
  const postComment = async (postId: string) => {
    const { data: newComment, error } = await supabase
      .from('comments')
      .insert([
        { 
          post_id: postId, 
          content: comment, 
          user_id: user.id, // add the user_id here
        },
      ])
      .select();

    if (error) {
      console.error('There was an error inserting the comment', error)
    } else {
      setComment('')
      // Add this line to update comments immediately after posting a new one
      setComments([...comments, { id: newComment![0].id, content: comment, user_id: user.id, post_id: postId }])
    }
  }

  return (
    <div key={post.id} style={{ marginBottom: '2rem', border: '1px solid #ddd', padding: '1rem' }}>
      <h3>{post.title}</h3>
      <p>{post.content}</p>
      <p>Posted by: {post.user_id}</p>
      <button onClick={() => setShowComments(!showComments)}>
        {showComments ? 'Hide Comments' : 'Show Comments'}
      </button>
      {showComments && (
        <div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write your comment here"></textarea>
          <button onClick={() => postComment(post.id)}>Post Comment</button>
          <h3>Comments</h3>
          {comments.map(comment => (
            <div key={comment.id}>
              <p>{comment.content}</p>
              <p>Commented by: {comment.user_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home({ initialPosts, user }: { initialPosts: PostType[], user: User }) {
  const [posts, setPosts] = useState(initialPosts)

  return (
    <>
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ textAlign: 'center' }}>YOUR FEED</h1>

        <h2>Posts</h2>
        {posts.filter(Boolean).map((post) => (
          <Post key={post.id} post={post} user={user} />   // Add a key prop here
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