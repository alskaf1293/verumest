import React from 'react';
import styles from '../styles/YourPost.module.css';
import mainstyles from '../styles/App.module.css'

interface Post {
  id: string;
  title: string;
  content: string;
  viewed_by?: string[];
}

interface UserPostsProps {
  posts: Post[];
}

const YourPosts: React.FC<UserPostsProps> = ({ posts }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.yourposts}>Your Posts</h2>
      {posts.filter(Boolean).map((post) => (
        <div key={post.id} style={{ marginBottom: '2rem', padding: '1rem' }}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
          {post.viewed_by && (
            <p>Viewed by: {
              post.viewed_by?.map((userId: string) => {
                return userId;
              }).join(', ')
            }</p>
          )}
          <div className={mainstyles.separatorBar}></div>
        </div>
      ))}
    </div>
  );
}

export default YourPosts;