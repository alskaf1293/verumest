import styles from '../styles/YourPost.module.css';
import mainstyles from '../styles/App.module.css'
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient.js'

interface Post {
    id: string;
    title: string;
    content: string;
    viewed_by?: string[];
  }
  
  interface UserPostsProps {
    posts: Post[];
  }
  
  interface UserProfile {
    user_id: string;
    name: string;
  }
  
  const YourPosts: React.FC<UserPostsProps> = ({ posts }) => {
    const [userProfiles, setUserProfiles] = useState<{ [key: string]: string }>({});
  
    useEffect(() => {
      // Fetch the user profiles when the component mounts
      const fetchProfiles = async () => {
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('*')
  
        if (error) {
          console.error('Error fetching user profiles:', error);
          return;
        }
        
        // Create an object where the keys are user IDs and the values are user names
        const profilesDict = profiles?.reduce((acc, profile) => ({
          ...acc,
          [profile.user_id]: profile.name,
        }), {});
        setUserProfiles(profilesDict || {});
      }
  
      fetchProfiles();
    }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.yourposts}>Your Posts</h2>
      {posts.filter(Boolean).map((post) => (
        <div key={post.id} style={{ marginBottom: '2rem', padding: '1rem' }}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
          {post.viewed_by && (
            <p>Viewed by: {
              post.viewed_by.map((userId: string) => {
                // Look up the user name in the userProfiles dictionary
                return userProfiles[userId] || 'Unnamed user';
              }).join(', ')
            }</p>
          )}
          <div className={mainstyles.separatorBar}></div>
        </div>
      ))}
    </div>
  );
};

export default YourPosts;