// MessagesPage.js

import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './MessagesPage.css';

const MessagesPage = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null); // New state for errors

  const BACKEND_URL = 'http://localhost:8080'; // Update this if your backend runs elsewhere

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get(
          `${BACKEND_URL}/api/messages/conversations/${encodeURIComponent(user.sub)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setConversations(response.data);
        setError(null); // Reset error on success
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to load conversations. Please try again later.');
      }
    };

    if (user && user.sub) {
      fetchConversations();
    }
  }, [user, getAccessTokenSilently]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get(
          `${BACKEND_URL}/api/messages/${encodeURIComponent(selectedConversation.conversation_id)}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages. Please try again later.');
      }
    };

    fetchMessages();
  }, [selectedConversation, getAccessTokenSilently]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${BACKEND_URL}/api/messages/${encodeURIComponent(selectedConversation.conversation_id)}/messages`,
        { senderId: user.sub, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, response.data]);
      setNewMessage(''); // Clear input
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="messages-page">
      {/* Left: Conversations */}
      <div className="history">
        <h3>Conversations</h3>
        {error && <p className="error-message">{error}</p>}
        <ul>
          {conversations.map((conversation) => (
            <li
              key={conversation.conversation_id}
              onClick={() => setSelectedConversation(conversation)}
              className={
                selectedConversation?.conversation_id === conversation.conversation_id
                  ? 'active'
                  : ''
              }
            >
              <p>
                {conversation.user1_id === user.sub
                  ? conversation.user2_name || conversation.user2_id
                  : conversation.user1_name || conversation.user1_id}
              </p>
              <small>{conversation.last_message}</small>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: Chat Content */}
      <div className="main-content">
        {selectedConversation ? (
          <>
            <h3>
              Chat with {selectedConversation.user2_name || selectedConversation.user2_id}
            </h3>
            <div className="messages">
              {messages.map((message) => (
                <div
                  key={message.message_id}
                  className={message.sender_id === user.sub ? 'sent' : 'received'}
                >
                  {message.content}
                </div>
              ))}
            </div>
            <div className="message-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </>
        ) : (
          <p>Select a conversation to view messages.</p>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
