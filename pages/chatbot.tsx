import React, { useState } from 'react';
import axios from 'axios';

type Message = {
    text: string;
    user: string;
  };

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    const sendMessage = async (event) => {
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

export default Chat;