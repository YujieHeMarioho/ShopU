// MessagesPage.js

import React, { useEffect, useState } from 'react';
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

  // Function to fetch a user's details by Auth0 ID
  const fetchUserDetails = async (userId, token) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/user/${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.username || userId; // Fallback to ID if username is missing
    } catch (err) {
      console.error(`Error fetching user details for ${userId}:`, err);
      return userId; // Fallback to ID in case of error
    }
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
          conv.user1_id === user.sub ? conv.user2_id : conv.user1_id
        );

        // Step 3: Remove duplicate IDs to optimize API calls
        const uniqueOtherUserIds = [...new Set(otherUserIds)];

        // Step 4: Fetch usernames for all unique other user IDs
        const usernamesPromises = uniqueOtherUserIds.map((id) => fetchUserDetails(id, token));
        const usernames = await Promise.all(usernamesPromises);

        // Step 5: Create a mapping from user ID to username
        const userIdToUsernameMap = {};
        uniqueOtherUserIds.forEach((id, index) => {
          userIdToUsernameMap[id] = usernames[index];
        });

        // Step 6: Enhance conversations with the other participant's username and profile picture
        const enhancedConversations = conversationsData.map((conv) => {
          const otherUserId = conv.user1_id === user.sub ? conv.user2_id : conv.user1_id;
          const otherUsername = userIdToUsernameMap[otherUserId] || otherUserId; // Fallback to ID if username is missing
          const otherProfilePicture = conv.user1_id === user.sub ? conv.user2_picture : conv.user1_picture; // Assuming profile pictures are included

          return {
            ...conv,
            otherUserId,
            otherUsername,
            otherProfilePicture, // Include profile picture
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
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, getAccessTokenSilently]);

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
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="messages-page">
      {/* Left: Conversations */}
      <div className="history">
        <h3>Conversations</h3>
        {error && <p className="error-message">{error}</p>}
        {isLoadingConversations ? (
          <p>Loading conversations...</p>
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
                    alt={conversation.otherUsername}
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
              <p>Loading messages...</p>
            ) : (
              <div className="messages">
                {messages.map((message) => (
                  <div
                    key={message.message_id}
                    className={message.sender_id === user.sub ? 'sent' : 'received'}
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
                ))}
              </div>
            )}
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
