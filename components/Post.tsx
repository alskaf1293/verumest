// Post.tsx
import React, { useState, useEffect } from 'react'
import { User } from '@supabase/auth-helpers-nextjs'
import { supabase } from '../pages/supabaseClient.js'
import styles from '../styles/App.module.css';
import postStyles from '../styles/Post.module.css'
import Link from 'next/link'

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
      <Link href={`/user/${post.user_id}`}>
        <div key={post.id} className={styles.post}>
          <h3 className={postStyles.title}>{post.title}</h3>
          <p>{post.content}</p>
          {/*<p>Posted by: {post.user_id}</p> */}
          <button className={postStyles.showComments} onClick={() => setShowComments(!showComments)}>
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
          <div className={styles.separatorBar}></div>
        </div>
      </Link>
    )
  }

export default Post;