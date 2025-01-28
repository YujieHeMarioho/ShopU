// MessagesPage.js

import React, { useEffect, useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './MessagesPage.css';

const MessagesPage = () => {
  const { user, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null); // State for error messages
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const BACKEND_URL = 'http://localhost:8080'; // Update this if your backend runs elsewhere

  const userCache = useRef({}); // Initialize an empty cache
  const messagesEndRef = useRef(null); // Ref for auto-scrolling

  // Function to fetch a user's details by Auth0 ID with caching
  const fetchUserDetails = async (userId, token) => {
    if (userCache.current[userId]) {
      return userCache.current[userId];
    }
    try {
      const response = await axios.get(`${BACKEND_URL}/api/user/${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = {
        username: response.data.username || userId, // Fallback to ID if username is missing
        picture: response.data.picture || 'https://via.placeholder.com/40', // Fallback image
      };
      userCache.current[userId] = userData; // Cache the result
      return userData;
    } catch (err) {
      console.error(`Error fetching user details for ${userId}:`, err);
      const fallbackData = { username: userId, picture: 'https://via.placeholder.com/40' };
      userCache.current[userId] = fallbackData; // Cache the fallback
      return fallbackData;
    }
  };

  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversations and associated usernames
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      try {
        const token = await getAccessTokenSilently();

        // Step 1: Fetch conversations for the current user
        const conversationsResponse = await axios.get(
          `${BACKEND_URL}/api/messages/conversations/${encodeURIComponent(user.sub)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const conversationsData = conversationsResponse.data;

        // Step 2: Identify the other participant's Auth0 ID in each conversation
        const otherUserIds = conversationsData.map((conv) =>
          conv.user1_id.toLowerCase() === user.sub.toLowerCase() ? conv.user2_id : conv.user1_id
        );

        // Step 3: Remove duplicate IDs to optimize API calls
        const uniqueOtherUserIds = [...new Set(otherUserIds)];

        // Step 4: Fetch usernames and profile pictures for all unique other user IDs
        const userDetailsPromises = uniqueOtherUserIds.map((id) => fetchUserDetails(id, token));
        const userDetails = await Promise.all(userDetailsPromises);

        // Step 5: Create a mapping from user ID to user details
        const userIdToDetailsMap = {};
        uniqueOtherUserIds.forEach((id, index) => {
          userIdToDetailsMap[id] = userDetails[index];
        });

        // Step 6: Enhance conversations with the other participant's username and profile picture
        const enhancedConversations = conversationsData.map((conv) => {
          const otherUserId =
            conv.user1_id.toLowerCase() === user.sub.toLowerCase() ? conv.user2_id : conv.user1_id;
          const { username, picture } = userIdToDetailsMap[otherUserId] || {
            username: 'Unknown User',
            picture: 'https://via.placeholder.com/40',
          };

          return {
            ...conv,
            otherUserId,
            otherUsername: username,
            otherProfilePicture: picture,
          };
        });

        // Step 7: Update state with enhanced conversations
        setConversations(enhancedConversations);
        setError(null); // Reset error on success
      } catch (err) {
        console.error('Error fetching conversations or usernames:', err);
        setError('Failed to load conversations. Please try again later.');
      } finally {
        setIsLoadingConversations(false);
      }
    };

    if (!authLoading && user && user.sub) {
      fetchConversations();
    }
  }, [user, getAccessTokenSilently, authLoading]);

  // Fetch messages for the selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get(
          `${BACKEND_URL}/api/messages/${encodeURIComponent(selectedConversation.conversation_id)}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(response.data);
        setError(null); // Reset error on success
        // Scroll to bottom after fetching messages
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, getAccessTokenSilently]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a new message
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
      setNewMessage(''); // Clear input field
      setError(null); // Reset error on success
      // Scroll to bottom after sending a message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
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
    <div className="messages-page">
      {/* Left: Conversations */}
      <div className="history">
        <h3>Conversations</h3>
        {error && <p className="error-message">{error}</p>}
        {isLoadingConversations ? (
          <div className="spinner">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <p>No conversations found. Start chatting with your friends!</p>
        ) : (
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
                <div className="conversation-info">
                  <img
                    src={conversation.otherProfilePicture || 'https://via.placeholder.com/40'}
                    alt={`Avatar of ${conversation.otherUsername}`}
                    className="conversation-avatar"
                  />
                  <div>
                    <p>{conversation.otherUsername}</p>
                    <small>{conversation.last_message}</small>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right: Chat Content */}
      <div className="main-content">
        {selectedConversation ? (
          <>
            <h3>Chat with {selectedConversation.otherUsername}</h3>
            {isLoadingMessages ? (
              <div className="spinner">Loading messages...</div>
            ) : (
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
            )}
            <div className="message-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
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
