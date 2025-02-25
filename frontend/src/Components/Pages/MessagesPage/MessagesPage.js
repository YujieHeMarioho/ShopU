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
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Cache for user details
  const userCache = useRef({});
  const userCachePromise = useRef({});

  // Ref for messages polling interval
  const messagesIntervalRef = useRef(null);

  // Container for scrolling messages
  const messagesContainerRef = useRef(null);

  // -----------------------------
  // Force Scroll to Bottom
  // -----------------------------
  const forceScrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  // -----------------------------
  // Handle scroll event
  // -----------------------------
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 50;
    setIsUserNearBottom(scrollHeight - (scrollTop + clientHeight) < threshold);
  };

  // -----------------------------
  // Fetch user details with caching
  // -----------------------------
  const fetchUserDetails = async (userId, token) => {
    if (userCache.current[userId]) return userCache.current[userId];
    if (userCachePromise.current[userId]) return userCachePromise.current[userId];

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
        const userData = {
          username: response.data.username || userId,
          picture: validPicture,
        };
        userCache.current[userId] = userData;
        delete userCachePromise.current[userId];
        return userData;
      })
      .catch((error) => {
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
  // Fetch conversation list
  // -----------------------------
  const fetchConversations = async (isPolling = false) => {
    if (!isPolling) setIsLoadingConversations(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(
        `${BACKEND_URL}/api/messages/conversations/${encodeURIComponent(user.sub)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data;
      console.log('Conversations fetched:', data);

      const otherUserIds = data.map((conv) =>
        conv.user1_id.toLowerCase() === user.sub.toLowerCase() ? conv.user2_id : conv.user1_id
      );
      const userDetailsList = await fetchAllUserDetails(otherUserIds, token);
      const uniqueIds = [...new Set(otherUserIds)];
      const userIdToDetailsMap = {};
      uniqueIds.forEach((id, idx) => {
        userIdToDetailsMap[id] = userDetailsList[idx];
      });
      const conversationsData = conversationsResponse.data;

      // Step 6: Enhance conversations with the other participant's username and profile picture
      const enhancedConversations = conversationsData.map((conv) => {
        const isUser1 = conv.user1_id === user.sub;

        return {
          ...conv,
          otherUserId: isUser1 ? conv.user2_id : conv.user1_id,
          otherUsername: isUser1 ? conv.user2_name : conv.user1_name,
          otherProfilePicture: isUser1 ? conv.user2_profile_image : conv.user1_profile_image,
          // If this conversation is currently selected, force unread_count to 0
          unread_count:
            selectedConversation && conv.conversation_id === selectedConversation.conversation_id
              ? 0
              : conv.unread_count || 0,
        };
      });

      setConversations(enhancedConvs);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations. Please try again later.');
    } finally {
      if (!isPolling) setIsLoadingConversations(false);
    }
  };

  // -----------------------------
  // Initial conversation fetch on mount
  // -----------------------------
  useEffect(() => {
    if (!authLoading && user && user.sub) {
      fetchConversations();
    }
  }, [authLoading, user, getAccessTokenSilently, BACKEND_URL]);

  // -----------------------------
  // Poll for updated conversations (for unread counts)
  // -----------------------------
  useEffect(() => {
    if (!authLoading && user && user.sub) {
      const intervalId = setInterval(() => {
        fetchConversations(true);
      }, 2000);
      return () => clearInterval(intervalId);
    }
  }, [authLoading, user, getAccessTokenSilently, BACKEND_URL, selectedConversation]);

  // -----------------------------
  // Fetch messages for a given conversation ID
  // -----------------------------
  const fetchMessagesForConversation = async (conversationId, isPolling = false) => {
    if (!isPolling) setIsLoadingMessages(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(
        `${BACKEND_URL}/api/messages/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again later.');
    } finally {
      if (!isPolling) setIsLoadingMessages(false);
    }
  };

  // -----------------------------
  // Mark conversation as read (API call)
  // -----------------------------
  const markConversationAsRead = async (conversationId) => {
    try {
      const token = await getAccessTokenSilently();
      const url = `${BACKEND_URL}/api/messages/${conversationId}/mark-read`;
      console.log("Marking conversation as read at:", url, "for user", user.sub);
      const response = await axios.post(
        url,
        { userId: user.sub },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Mark conversation as read response:", response.data);
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  // -----------------------------
  // Handle conversation selection
  // -----------------------------
  const handleSelectConversation = (conv) => {
    // Immediately clear messages so the old conversation's messages vanish.
    setMessages([]);
    // Immediately update local state to clear the unread badge for the selected conversation.
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c
      )
    );
    // Set the selected conversation immediately.
    setSelectedConversation(conv);
    // Clear any existing messages polling interval.
    if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
    // Immediately fetch messages for the new conversation.
    fetchMessagesForConversation(conv.conversation_id, false);
    // Start a new polling interval for the new conversation (without flashing spinner).
    messagesIntervalRef.current = setInterval(() => {
      fetchMessagesForConversation(conv.conversation_id, true);
      markConversationAsRead(conv.conversation_id);
    }, 2000);
  };

  // -----------------------------
  // Scroll behavior after messages update
  // -----------------------------
  useEffect(() => {
    if (messages.length > 0 && isUserNearBottom) {
      forceScrollToBottom();
    }
  }, [messages, isUserNearBottom]);

  // -----------------------------
  // Send a message
  // -----------------------------
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${BACKEND_URL}/api/messages/${encodeURIComponent(selectedConversation.conversation_id)}/messages`,
        { senderId: user.sub, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
      setError(null);
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
  // Render
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
                onClick={() => handleSelectConversation(conv)}
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
                    <p>
                      {conv.otherUsername}
                      {conv.unread_count > 0 && (
                        <span className="unread-badge">{conv.unread_count}</span>
                      )}
                    </p>
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
