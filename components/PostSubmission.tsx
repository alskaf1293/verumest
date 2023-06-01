import React, { useState } from 'react'
import { Database } from '../types/database'
import { useSupabaseClient, User } from '@supabase/auth-helpers-react'
import styles from '../styles/YourPost.module.css';

type PostSubmissionProps = {
  user: User;
  onNewPost: (post: any) => void;
}

export default function PostSubmission({ user, onNewPost }: PostSubmissionProps) {
  const supabase = useSupabaseClient<Database>()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handlePostSubmit = async () => {
    const newPost = { title, content, user_id: user.id }
    const { data, error } = await supabase
      .from('posts')
      .insert([newPost])
      .select()

    if (error) {
      console.log("Error creating post:", error)
    } else if (data) {
      onNewPost(data[0])
    }
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 className={styles.createpost}>Create Post</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className={styles.titletextbox}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content"
        className={styles.contenttextbox}
      />
      <button
        onClick={handlePostSubmit}
        className={styles.submitpost}
      >
        Create
      </button>
    </div>
  )
}