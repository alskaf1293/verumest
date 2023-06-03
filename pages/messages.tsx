import { GetServerSidePropsContext } from 'next'
import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient'
import Application from '@/components/Application';
import HomeFeed from '@/components/HomeFeed';
import RightSidebar from '@/components/RightSidebar';
import Sidebar from '@/components/Sidebar';
type Message = {
    text: string;
    user: string;
  };
  type ChatRequest = {
    id: string;
    sender_id: string;
    receiver_id: string;
    sender_name: string;
    receiver_name: string;
    message: string;
    status: string;
  };

  type ChatMessage = {
    id: string;
    sender_id: string;
    receiver_id: string;
    sender_name: string;
    receiver_name: string;
    message: string;
  };
  
  export default function Chat({ user}: { user: User}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [selectedChatPartner, setSelectedChatPartner] = useState('');
    const chatPartners = Array.from(new Set(chatMessages.map(msg => (msg.sender_id !== user.id ? msg.sender_id : msg.receiver_id))));
    
  useEffect(() => {
    fetchChatMessages();
  }, [chatRequests])

  const fetchChatMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true }) // Order by creation time

    if (error) {
      console.error('Error fetching chat messages:', error)
      return
    }

    setChatMessages(data as ChatMessage[]);
  }

  const sendChatMessage = async (event : FormEvent) => {
    event.preventDefault();
  
    // Check if there is an accepted chat request with the current user
    const chatRequest = chatRequests.find(request => 
      request.status === 'accepted' && 
      ((request.sender_id === user.id && request.receiver_id === selectedChatPartner) || 
       (request.receiver_id === user.id && request.sender_id === selectedChatPartner)));

    console.log("selectedChatPartner: ", selectedChatPartner);
    console.log("chatRequests: ", chatRequests);
    console.log("chatRequest: ", chatRequest);
    if (!chatRequest) {
      alert('You cannot send a message until your chat request is accepted.');
      return;
    }
    const isSender = chatRequest.sender_id == user.id
    if(isSender){
      const { error } = await supabase
        .from('chat_messages')
        .insert([
          { sender_id: user.id, receiver_id: selectedChatPartner, sender_name: chatRequest.sender_name, receiver_name: chatRequest.receiver_name, message: input },
        ])
        if (error) {
          console.error('Error sending message:', error)
          return
        }
    } else{
      const { error } = await supabase
        .from('chat_messages')
        .insert([
          { sender_id: user.id, receiver_id: selectedChatPartner, sender_name: chatRequest.receiver_name, receiver_name: chatRequest.sender_name, message: input },
        ])
        if (error) {
          console.error('Error sending message:', error)
          return
        }
    }
  
    // Refresh chat messages
    fetchChatMessages();
  
    setInput('');
  }


  useEffect(() => {
    fetchChatRequests();
  }, []);

  const fetchChatRequests = async () => {
    const { data, error } = await supabase
      .from('chat_requests')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
  
    if (error) {
      console.error('Error fetching chat requests:', error)
      return
    }
  
    setChatRequests(data as ChatRequest[]);
  }

  const handleChatRequest = async (requestId: string, status: string) => {
    // Fetch the chat request that needs to be updated
    const { data: chatRequest, error: fetchError } = await supabase
        .from('chat_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (fetchError || !chatRequest) {
        console.error('Error fetching chat request:', fetchError)
        return;
    }

    // Update the chat request status
    const { error: updateError } = await supabase
        .from('chat_requests')
        .update({ status })
        .eq('id', requestId);

    if (updateError) {
        console.error('Error updating chat request:', updateError)
        return;
    }

    // If the request was accepted, create a new chat message
    if (status === 'accepted') {
        const { error: insertError } = await supabase
            .from('chat_messages')
            .insert([
                { sender_id: chatRequest.sender_id, receiver_id: chatRequest.receiver_id, message: 'Chat started' },
            ]);

        if (insertError) {
            console.error('Error starting chat:', insertError);
            return;
        }
    }

    // Refresh chat requests and chat messages
    fetchChatRequests();
    fetchChatMessages();
}

  const sendMessage = async (event : FormEvent) => {
    event.preventDefault();
  
    const userMessage = { text: chatInput, user: 'You' };  // Use chatInput here
  
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: "system",
            content: "You are to chat with the user, learn more about their interests, and learn more about them. You should initialize the questions, as the user often might not know what to say. Don't put them in that situation. Keep the conversation casual and be efficient with your words. We want to know as much about the user in as little time as possible."
          },
          {
            role: "user",
            content: `${messages.map((message) => message.text).join('\n')}\n${chatInput}\n` // Use chatInput here
          }
        ],
        max_tokens: 200,
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
      
    const botMessage = { text: response.data.choices[0].message.content, user: 'Bot' };
  
    setMessages([...messages, userMessage, botMessage]);
    setChatInput('');  // Reset chatInput instead of input
  };

    const submitChat = async () => {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

      const chatHistory = messages.map((message) => `${message.user}: ${message.text}`).join('\n');
      
      const { error } = await supabase
              .from('chat_history') // Replace with your table name
              .insert([
                  { 
                      user_id: user.id, // assuming "user" prop includes the user id
                      chat_history: chatHistory, // store the sentence
                  },
              ]);

      const sentencesResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
              model: 'gpt-4',
              messages: [
                  {
                      role: "system",
                      content: "This is a chat that a user had with a chatbot. Describe the user in as many descriptive sentences as you can, but do so from the first-person point of view. For example, \"I am very interested in video games.\" could be one description. Every unique description should be a sentence, and every sentence should represent a unique aspect of the user. End every sentence with a newline."
                  },
                  {
                      role: "user",
                      content: chatHistory
                  }
              ],
              max_tokens: 200,
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
  
      const bruh = sentencesResponse.data.choices[0].message.content;
      const sentences = bruh.split('\n');
      
      for (const sentence of sentences) {
          const response = await axios.post(
              'https://api.openai.com/v1/embeddings',
              {
                  model: 'text-embedding-ada-002',
                  input: sentence
              },
              {
                  headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ` + process.env.NEXT_PUBLIC_API_KEY,
                  },
              }
          );
          
          const embedding = response.data.data[0].embedding; // hypothetical response format
          
          // Insert embedding into Supabase DB
          const { error } = await supabase
              .from('chat_embeddings') // Replace with your table name
              .insert([
                  { 
                      user_id: user.id, // assuming "user" prop includes the user id
                      embedding: embedding, // store the embedding
                      sentiment: sentence, // store the sentence
                  },
              ]);
          
          if (error) {
              console.log('Error inserting embedding:', error);
          } else {
              console.log('Embedding inserted successfully');
          }
      }
  };

  return (
    <Application>
      <Sidebar/>
      <HomeFeed>
        <h2>Chat Requests</h2>
        {chatRequests.map((request) => (
          request.status !== 'accepted' && (
            <div key={request.id}>
              <p>
                <strong>{request.sender_id}: </strong> {request.message}
              </p>
              <button onClick={() => handleChatRequest(request.id, 'accepted')}>Accept</button>
              <button onClick={() => handleChatRequest(request.id, 'rejected')}>Reject</button>
            </div>
          )
        ))}
        <br></br>
        <br></br>
        {/* Display chat partners on the side */}
        <div style={{ display: 'flex' }}>
            <div style={{ marginRight: '20px' }}>
                {chatPartners.map((partner) => (
                    <button 
                        key={partner}
                        style={partner === selectedChatPartner ? { backgroundColor: 'lightblue' } : undefined}
                        onClick={() => setSelectedChatPartner(partner)}
                    >
                        {partner}
                    </button>
                ))}
            </div>

            {/* Display chat messages */}
            <div>
                {chatMessages
                .filter(
                    (message) =>
                    (message.sender_id === user.id && message.receiver_id === selectedChatPartner) ||
                    (message.sender_id === selectedChatPartner && message.receiver_id === user.id)
                )
                .map((message) => (
                    <div key={message.id} style={{ backgroundColor: message.sender_id === user.id ? 'lightblue' : 'lightgreen' }}>
                    <p>
                        <strong>{message.sender_name}: </strong> {message.message}
                    </p>
                    </div>
                ))}
                {selectedChatPartner && (
                <form onSubmit={sendChatMessage}>
                    <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message"
                    style={{color: 'black'}}
                    />
                    <button type="submit">Send</button>
                </form>
                )}
            </div>
        </div>
        
        <br></br>
        <br></br>
        <br></br>
        <label>CHATGPT</label>
        <div style={{color: 'white'}}>
          {messages.map((message, index) => (
            <p key={index}><strong>{message.user}:</strong> {message.text}</p>
          ))}
        </div>
        <form onSubmit={sendMessage}>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message"
            style={{color: 'black'}}
          />
          <button type="submit">Send</button>
        </form>

        <button onClick={submitChat}>Submit chat</button>
      </HomeFeed>
      <RightSidebar/>
    </Application>
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

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  }
}