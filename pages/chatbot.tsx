import { GetServerSidePropsContext } from 'next'
import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js';

type Message = {
    text: string;
    user: string;
  };

  export default function Chat({ user, initialPosts, firstVisit }: { user: User, initialPosts: any[], firstVisit: boolean }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    const sendMessage = async (event: FormEvent) => {
      event.preventDefault();
    
      const userMessage = { text: input, user: 'You' };
    
      const initialPrompt = "You are to chat with the user, learn more about their interests, and learn more about them. You should initialize the questions, as the user often might not know what to say. Don't put them in that situation. Keep the conversation casual and be efficient with your words. We want to know as much about the user in as little time as possible.";
      const subsequentPrompt = "Keep the conversation flowing. Have them talk about themselves and make sure they feel free to express their opinions about anything. The user often might not know what to say. Don't put them in that situation.";
    
      const prompt = firstVisit ? initialPrompt : subsequentPrompt;
    
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
          {
              role: "system",
              content: prompt
          },
          {
              role: "user",
              content: `${messages.map((message) => message.text).join('\n')}\n${input}\n`
          }
          ],
          max_tokens: 50,
          n: 1,
          stop: null,
          temperature: 0.5,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ` + process.env.NEXT_PUBLIC_API_KEY,
          },
        }
      );
    
      const botMessage = { text: response.data.choices[0].message.content, user: 'Bot' };
    
      setMessages([...messages, userMessage, botMessage]);
      setInput('');
    };

    const submitChat = async () => {
      const chatHistory = messages.map((message) => `${message.user}: ${message.text}`).join('\n');
      
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

      // Store chat history if this is not the first visit
      if (!firstVisit) {
        const { error: chatHistoryError } = await supabase
          .from('chat_history')
          .insert([
            { 
              user_id: user.id,
              chat: chatHistory,
              timestamp: new Date(),
            },
          ]);

        if (chatHistoryError) {
          console.log('Error inserting chat history:', chatHistoryError);
        } else {
          console.log('Chat history inserted successfully');
        }
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-0314',
          messages: [
            {
              role: "system",
              content: "This is a chat that a user had with a chatbot. From this, extract information about the following characteristics about the user. It is alright if you put some not-so-good qualities such as arrogance. It is alright if there isn't any information for a category. The goal is to make a short profile of the person. Eg. Personality: this person is arrogant, ..."
            },
            {
              role: "user",
              content: chatHistory
            }
          ],
          max_tokens: 2000,
          n: 1,
          stop: null,
          temperature: 0,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ` + process.env.NEXT_PUBLIC_API_KEY,
          },
        }
        
      );      

      const profile = response.data.choices[0].message.content;
      console.log(profile)
      // Insert profile into Supabase DB
      const { error } = await supabase
        .from('chat_profiles') // Replace with your table name
        .insert([
          { 
            user_id: user.id, // assuming "user" prop includes the user id
            profile: profile
          },
        ]);
    
      if (error) {
        console.log('Error inserting profile:', error);
      } else {
        console.log('Profile inserted successfully');
      }
      // After the user submits the chat for the first time, update the 'first_visit' flag in the database
      if (firstVisit) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ first_visit: false })
          .eq('user_id', user.id);
  
        if (updateError) {
          console.log('Error updating user:', updateError);
        } else {
          console.log('User updated successfully');
        }
      }
      
    };

  return (
    <div>
      <h1>Chat</h1>
      {messages.map((message, index) => (
        <p key={index}>
          <strong>{message.user}: </strong> {message.text}
        </p>
      ))}
      <form onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button type="submit">Send</button>
      </form>

      <button onClick={submitChat}>Submit chat</button>
    </div>
  );
};

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

  const { data: userWithFlag, error: flagError } = await supabase
    .from('user_profiles')
    .select('first_visit')
    .eq('user_id', session.user.id);

  if (flagError) console.log("Error fetching user's first visit flag:", flagError)

  const firstVisit = userWithFlag ? userWithFlag[0].first_visit : false;

  return {
    props: {
      initialSession: session,
      user: session.user,
      initialPosts: posts,
      firstVisit: firstVisit,
    },
  }
}