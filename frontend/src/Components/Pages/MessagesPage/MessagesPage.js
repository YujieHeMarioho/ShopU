import React, { useEffect, useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useSocket } from '../../../SocketContext'; // <-- Adjust path as needed
import './MessagesPage.css';

const MessagesPage = () => {
  const { user, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const socket = useSocket(); // <-- our Socket.IO client instance

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null); 
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL; 
  const userCache = useRef({}); 
  const messagesEndRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ----------- 1) Fetch Conversations -----------
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      try {
        const token = await getAccessTokenSilently();
        const conversationsResponse = await axios.get(
          `${BACKEND_URL}/api/messages/conversations/${encodeURIComponent(user.sub)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const conversationsData = conversationsResponse.data;

        // Identify other participant
        const otherUserIds = conversationsData.map((conv) =>
          conv.user1_id.toLowerCase() === user.sub.toLowerCase()
            ? conv.user2_id
            : conv.user1_id
        );

        // Deduplicate IDs
        const uniqueOtherUserIds = [...new Set(otherUserIds)];

        // Fetch user details for each participant
        const userDetailsPromises = uniqueOtherUserIds.map((id) =>
          fetchUserDetails(id, token)
        );
        const userDetails = await Promise.all(userDetailsPromises);

        // Map user ID -> detail
        const userIdToDetailsMap = {};
        uniqueOtherUserIds.forEach((id, index) => {
          userIdToDetailsMap[id] = userDetails[index];
        });

        // Enhance each conversation with the other user’s username & pic
        const enhancedConversations = conversationsData.map((conv) => {
          const otherUserId =
            conv.user1_id.toLowerCase() === user.sub.toLowerCase()
              ? conv.user2_id
              : conv.user1_id;
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

        setConversations(enhancedConversations);
        setError(null);
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
  }, [user, getAccessTokenSilently, authLoading, BACKEND_URL]);

  // ----------- 2) Fetch Messages for Selected Conversation -----------
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
        setError(null);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, getAccessTokenSilently, BACKEND_URL]);

  // ----------- 3) Join Room & Listen for “newMessage” via Socket.IO -----------
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    // Join this conversation’s room on the server
    socket.emit('joinConversation', selectedConversation.conversation_id);

    // Listen for live “newMessage” events from the server
    const handleNewMessage = (incomingMessage) => {
      // Only add if message belongs to the currently selected conversation
      if (
        incomingMessage.conversation_id === selectedConversation.conversation_id
      ) {
        setMessages((prev) => [...prev, incomingMessage]);
        setTimeout(scrollToBottom, 100);
      }
    };

    socket.on('newMessage', handleNewMessage);

    // Cleanup when conversation changes or component unmounts
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, selectedConversation]);

  // ----------- 4) Scroll to bottom when messages change -----------
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ----------- 5) Send Message -----------
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${BACKEND_URL}/api/messages/${encodeURIComponent(selectedConversation.conversation_id)}/messages`,
        { senderId: user.sub, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optionally do optimistic UI update
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
      setError(null);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  // ----------- 6) Handle Enter Key -----------
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ----------- 7) Helper: Fetch User Details w/ Caching -----------
  const fetchUserDetails = async (userId, token) => {
    if (userCache.current[userId]) {
      return userCache.current[userId];
    }
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/user/${encodeURIComponent(userId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const userData = {
        username: response.data.username || userId,
        picture: response.data.picture || 'https://via.placeholder.com/40',
      };
      userCache.current[userId] = userData;
      return userData;
    } catch (err) {
      console.error(`Error fetching user details for ${userId}:`, err);
      const fallbackData = {
        username: userId,
        picture: 'https://via.placeholder.com/40',
      };
      userCache.current[userId] = fallbackData;
      return fallbackData;
    }
  };

  // ----------- Render UI -----------
  return (
    <div className="messages-page">
      {/* Left: Conversation List */}
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
                  selectedConversation?.conversation_id ===
                  conversation.conversation_id
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

      {/* Right: Selected Conversation Messages */}
      <div className="main-content">
        {selectedConversation ? (
          <>
            <h3>Chat with {selectedConversation.otherUsername}</h3>
            {isLoadingMessages ? (
              <div className="spinner">Loading messages...</div>
            ) : (
              <div className="messages">
                {messages.map((message) => {
                  const isSent =
                    message.sender_id.toLowerCase() === user.sub.toLowerCase();
                  return (
                    <div
                      key={message.message_id}
                      className={isSent ? 'sent' : 'received'}
                    >
                      <div className="message-bubble">
                        <p>{message.content}</p>
                        <span className="message-time">
                          {new Date(message.created_at).toLocaleTimeString(
                            [],
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {/* Dummy div to force scroll to bottom */}
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
