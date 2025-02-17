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

  const [error, setError] = useState(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  /**
   * `isFirstLoad` = `true` the moment we switch to a conversation.
   * We'll auto-scroll exactly once after the first batch of messages is rendered.
   */
  const [isFirstLoad, setIsFirstLoad] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const userCache = useRef({});

  // We'll scroll only inside this container
  const messagesContainerRef = useRef(null);

  // ---------------------------------------------
  // 1) Scroll to Bottom Helper
  // ---------------------------------------------
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // ---------------------------------------------
  // 2) On first render, fetch conversation list
  // ---------------------------------------------
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get(
          `${BACKEND_URL}/api/messages/conversations/${encodeURIComponent(
            user.sub
          )}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = response.data; // your conversation array

        // Identify other users
        const otherUserIds = data.map((conv) =>
          conv.user1_id.toLowerCase() === user.sub.toLowerCase()
            ? conv.user2_id
            : conv.user1_id
        );
        const uniqueIds = [...new Set(otherUserIds)];

        // Fetch user details
        const userDetailsPromises = uniqueIds.map((id) =>
          fetchUserDetails(id, token)
        );
        const userDetailsList = await Promise.all(userDetailsPromises);

        // Build a lookup
        const userIdToDetailsMap = {};
        uniqueIds.forEach((id, idx) => {
          userIdToDetailsMap[id] = userDetailsList[idx];
        });

        // Enhance the conversation data
        const enhancedConvs = data.map((conv) => {
          const otherId =
            conv.user1_id.toLowerCase() === user.sub.toLowerCase()
              ? conv.user2_id
              : conv.user1_id;
          const { username, picture } = userIdToDetailsMap[otherId] || {
            username: 'Unknown User',
            picture: 'https://via.placeholder.com/40',
          };
          return {
            ...conv,
            otherUsername: username,
            otherProfilePicture: picture,
          };
        });

        setConversations(enhancedConvs);
        setError(null);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations. Please try again later.');
      } finally {
        setIsLoadingConversations(false);
      }
    };

    if (!authLoading && user && user.sub) {
      fetchConversations();
    }
  }, [authLoading, user, getAccessTokenSilently, BACKEND_URL]);

  // ---------------------------------------------
  // 3) Fetch Messages (either first load or polls)
  // ---------------------------------------------
  const fetchMessages = async () => {
    if (!selectedConversation) return;

    // If this is the very first time for this conversation, show spinner
    if (isFirstLoad) {
      setIsLoadingMessages(true);
    }

    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(
        `${BACKEND_URL}/api/messages/${encodeURIComponent(
          selectedConversation.conversation_id
        )}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again later.');
    } finally {
      if (isFirstLoad) {
        setIsLoadingMessages(false);
      }
    }
  };

  // ---------------------------------------------
  // 4) When user selects a conversation, do first load + poll
  // ---------------------------------------------
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    // Mark that we want to auto-scroll on the first fetch
    setIsFirstLoad(true);

    // Immediately fetch once
    fetchMessages();

    // Then poll (no forced scroll)
    const intervalId = setInterval(() => {
      fetchMessages();
    }, 2000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [selectedConversation]);

  // ---------------------------------------------
  // 5) “Auto-scroll once” after messages change IF isFirstLoad is true
  // ---------------------------------------------
  useEffect(() => {
    // If it's the first load, we wait a bit so the DOM can render messages
    // Then scroll down, then mark we are done with the first load.
    if (isFirstLoad && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
        setIsFirstLoad(false); // don't do it again next time
      }, 150); 
      return () => clearTimeout(timer);
    }
  }, [isFirstLoad, messages]);

  // ---------------------------------------------
  // 6) Send Message (we DO scroll after sending)
  // ---------------------------------------------
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${BACKEND_URL}/api/messages/${encodeURIComponent(
          selectedConversation.conversation_id
        )}/messages`,
        { senderId: user.sub, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optimistic update
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
      setError(null);

      // Always scroll after we send
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  // ---------------------------------------------
  // 7) “Enter” key to send
  // ---------------------------------------------
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ---------------------------------------------
  // 8) Fetch user details (caching)
  // ---------------------------------------------
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
    } catch (error) {
      console.error(`Error fetching user details for ${userId}:`, error);
      const fallback = {
        username: userId,
        picture: 'https://via.placeholder.com/40',
      };
      userCache.current[userId] = fallback;
      return fallback;
    }
  };

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------
  return (
    <div className="messages-page">
      {/* LEFT: Conversation List */}
      <div className="history">
        <h3>Conversations</h3>
        {error && <p className="error-message">{error}</p>}

        {isLoadingConversations ? (
          <div className="spinner">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <p>No conversations found. Start chatting!</p>
        ) : (
          <ul>
            {conversations.map((conv) => (
              <li
                key={conv.conversation_id}
                onClick={() => setSelectedConversation(conv)}
                className={
                  selectedConversation?.conversation_id ===
                  conv.conversation_id
                    ? 'active'
                    : ''
                }
              >
                <div className="conversation-info">
                  <img
                    src={
                      conv.otherProfilePicture ||
                      'https://via.placeholder.com/40'
                    }
                    alt={`Avatar of ${conv.otherUsername}`}
                    className="conversation-avatar"
                  />
                  <div>
                    <p>{conv.otherUsername}</p>
                    <small>{conv.last_message}</small>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* RIGHT: Selected Conversation */}
      <div className="main-content">
        {selectedConversation ? (
          <>
            <h3>Chat with {selectedConversation.otherUsername}</h3>

            {isLoadingMessages ? (
              <div className="spinner">Loading messages...</div>
            ) : (
              <div
                className="messages"
                ref={messagesContainerRef}
                style={{
                  height: '400px',
                  overflowY: 'auto',
                  border: '1px solid #ccc',
                }}
              >
                {messages.map((message) => {
                  const isSent =
                    message.sender_id?.toLowerCase() === user.sub.toLowerCase();
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
