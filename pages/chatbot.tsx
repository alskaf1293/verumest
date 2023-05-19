import { GetServerSidePropsContext } from 'next'
import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'

type Message = {
    text: string;
    user: string;
  };

  export default function Chat({ user, initialPosts }: { user: User, initialPosts: any[] }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    const sendMessage = async (event : FormEvent) => {
      event.preventDefault();
    
      const userMessage = { text: input, user: 'You' };
    
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-0314',
          messages: [
          {
              role: "system",
              content: "You are to chat with the user, learn more about their interests, and learn more about them. You should initialize the questions, as the user often might not know what to say. Don't put them in that situation. Keep the conversation casual and be efficient with your words. We want to know as much about the user in as little time as possible."
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

  return {
    props: {
      initialSession: session,
      user: session.user,
      initialPosts: posts,
    },
  }
}