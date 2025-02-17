// ChatContent.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './ChatContent.css';

const ChatContent = () => {
  const { conversation_id } = useParams();
  const { user, getAccessTokenSilently } = useAuth0();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // A ref for the scrollable container, if needed.
  // We'll only scroll on sending a message.
  const messagesContainerRef = useRef(null);

  // 1) Poll for new messages every 2 seconds
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = await getAccessTokenSilently();
        // console.log(`Fetching messages for conversation ID: ${conversation_id}`);
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/messages/${conversation_id}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // console.log('Fetched messages:', response.data);
        setMessages(response.data);

        // NOTE: We do NOT scroll here. 
        // This prevents forcing the user down if they manually scrolled up.
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    // Fetch immediately
    fetchMessages();

    // Poll every 2 seconds
    const intervalId = setInterval(() => {
      fetchMessages();
    }, 2000);

    // Cleanup interval on unmount or conversation_id change
    return () => clearInterval(intervalId);
  }, [conversation_id, getAccessTokenSilently]);

  // 2) Scroll only after user sends a message (optional convenience)
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 
        messagesContainerRef.current.scrollHeight;
    }
  };

  // 3) Send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const token = await getAccessTokenSilently();
      // console.log('Sending message:', { conversation_id, senderId: user.sub, content: newMessage });
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/messages/${conversation_id}/messages`,
        { senderId: user.sub, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // console.log('Message sent successfully:', response.data);

      // Optimistically add the new message to local state
      setMessages((prev) => [...prev, response.data]);

      // Scroll to bottom so *you* see your newly sent message
      scrollToBottom();

      // Clear input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // 4) Press Enter to send
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-content">
      <h3>Chat</h3>

      {/* 5) The scrollable container (no forced scroll in polling) */}
      <div
        className="messages"
        ref={messagesContainerRef}
        style={{
          height: '400px',      // or '60vh'
          overflowY: 'auto',    // only scroll within this container
          border: '1px solid #ccc'
        }}
      >
        {messages.map((message) => {
          const isSent = message.sender_id.toLowerCase() === user.sub.toLowerCase();
          return (
            <div key={message.message_id} className={isSent ? 'sent' : 'received'}>
              <div className="message-bubble">
                <p>{message.content}</p>
                <span className="message-time">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input field & send button */}
      <div className="message-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatContent;
