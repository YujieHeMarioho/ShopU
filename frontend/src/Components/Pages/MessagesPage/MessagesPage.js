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
  const [isFirstLoad, setIsFirstLoad] = useState(false);

  // Tracks if the user is near the bottom of the message list
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Cache for user details and in-flight promise cache
  const userCache = useRef({});
  const userCachePromise = useRef({});
  // Ensure conversation list is fetched only once
  const conversationsFetched = useRef(false);

  // Container for scrolling messages
  const messagesContainerRef = useRef(null);

  // -----------------------------
  // Force Scroll to Bottom (used on first load or if user is near bottom)
  // -----------------------------
  const forceScrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  // -----------------------------
  // Handle scroll event to track if user is near the bottom
  // -----------------------------
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 50; // Adjust this threshold to your preference
    setIsUserNearBottom(scrollHeight - (scrollTop + clientHeight) < threshold);
  };

  // -----------------------------
  // Fetch user details with caching & promise caching
  // -----------------------------
  const fetchUserDetails = async (userId, token) => {
    if (userCache.current[userId]) {
      console.log(`User details for ${userId} found in cache`);
      return userCache.current[userId];
    }
    if (userCachePromise.current[userId]) {
      return userCachePromise.current[userId];
    }
    const promise = axios
      .get(`${BACKEND_URL}/api/user/${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const pictureFromAPI = response.data.picture;
        const validPicture =
          pictureFromAPI && pictureFromAPI.trim() !== ''
            ? pictureFromAPI
            : 'https://via.placeholder.com/40';
        if (validPicture === 'https://via.placeholder.com/40') {
          console.warn(`No valid picture for user ${userId}, using fallback.`);
        } else {
          console.log(`Fetched valid picture for user ${userId}`);
        }
        const userData = {
          username: response.data.username || userId,
          picture: validPicture,
        };
        userCache.current[userId] = userData;
        delete userCachePromise.current[userId];
        return userData;
      })
      .catch((error) => {
        if (error.response && error.response.status === 429) {
          console.error(`Rate limit reached for user ${userId}. Using fallback.`);
        } else if (error.response && error.response.status === 404) {
          console.error(`User ${userId} not found.`);
        } else {
          console.error(`Error fetching user details for ${userId}:`, error);
        }
        const fallback = {
          username: userId,
          picture: 'https://via.placeholder.com/40',
        };
        userCache.current[userId] = fallback;
        delete userCachePromise.current[userId];
        return fallback;
      });
    userCachePromise.current[userId] = promise;
    return promise;
  };

  // -----------------------------
  // Batch fetch user details for multiple IDs
  // -----------------------------
  const fetchAllUserDetails = async (userIds, token) => {
    const uniqueIds = [...new Set(userIds)];
    const promises = uniqueIds.map((id) => fetchUserDetails(id, token));
    return await Promise.all(promises);
  };

  // -----------------------------
  // Fetch conversation list (only once)
  // -----------------------------
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
        const data = response.data;
        console.log('Conversations fetched:', data);

        // Identify other user IDs
        const otherUserIds = data.map((conv) =>
          conv.user1_id.toLowerCase() === user.sub.toLowerCase()
            ? conv.user2_id
            : conv.user1_id
        );
        const userDetailsList = await fetchAllUserDetails(otherUserIds, token);
        const uniqueIds = [...new Set(otherUserIds)];
        const userIdToDetailsMap = {};
        uniqueIds.forEach((id, idx) => {
          userIdToDetailsMap[id] = userDetailsList[idx];
        });

        // Enhance conversation data with user details
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
        conversationsFetched.current = true;
        setError(null);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations. Please try again later.');
      } finally {
        setIsLoadingConversations(false);
      }
    };

    if (!authLoading && user && user.sub && !conversationsFetched.current) {
      fetchConversations();
    }
  }, [authLoading, user, getAccessTokenSilently, BACKEND_URL]);

  // -----------------------------
  // Fetch messages for selected conversation
  // -----------------------------
  const fetchMessages = async () => {
    if (!selectedConversation) return;
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

  // -----------------------------
  // When a conversation is selected, load messages & poll (every 5s)
  // -----------------------------
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    setIsFirstLoad(true);
    fetchMessages();
    const intervalId = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line
  }, [selectedConversation]);

  // -----------------------------
  // Scroll behavior after messages update
  // -----------------------------
  useEffect(() => {
    if (messages.length > 0) {
      // On the very first load, always scroll to bottom.
      if (isFirstLoad) {
        forceScrollToBottom();
        setIsFirstLoad(false);
      } 
      // Otherwise, scroll to bottom ONLY if user is near bottom
      else if (isUserNearBottom) {
        forceScrollToBottom();
      }
    }
  }, [messages, isFirstLoad, isUserNearBottom]);

  // -----------------------------
  // Send a message
  // -----------------------------
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

      // Only auto-scroll if user is near the bottom
      if (isUserNearBottom) {
        forceScrollToBottom();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  // -----------------------------
  // Send message on Enter key (without Shift)
  // -----------------------------
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
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
                  selectedConversation?.conversation_id === conv.conversation_id
                    ? 'active'
                    : ''
                }
              >
                <div className="conversation-info">
                  <img
                    src={conv.otherProfilePicture || 'https://via.placeholder.com/40'}
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
                onScroll={handleScroll}
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
