// ChatContent.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './ChatContent.css';

const ChatContent = () => {
  const { conversation_id } = useParams(); // Get conversation_id from URL
  const { user, getAccessTokenSilently } = useAuth0();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversation messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = await getAccessTokenSilently();
        console.log(`Fetching messages for conversation ID: ${conversation_id}`);
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/messages/${conversation_id}/messages`, // Ensure the URL is correct
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Fetched messages:', response.data); // Debugging log
        setMessages(response.data);
        // Scroll to bottom after fetching messages
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [conversation_id, getAccessTokenSilently]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send new message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      console.warn('Message content is empty, not sending.'); // Debugging log
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      console.log('Sending message:', { conversation_id, senderId: user.sub, content: newMessage });
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/messages/${conversation_id}/messages`,
        { senderId: user.sub, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Message sent successfully:', response.data); // Debugging log
      setMessages((prev) => [...prev, response.data]); // Update messages locally
      setNewMessage(''); // Clear input box
      // Scroll to bottom after sending a message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle pressing "Enter" key to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Allow Shift+Enter for new lines
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-content">
      <h3>Chat</h3>
      <div className="messages">
        {messages.map((message) => {
          const isSent = message.sender_id.toLowerCase() === user.sub.toLowerCase();
          return (
            <div
              key={message.message_id}
              className={isSent ? 'sent' : 'received'}
            >
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
        {/* Dummy div to scroll into view */}
        <div ref={messagesEndRef} />
      </div>
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
