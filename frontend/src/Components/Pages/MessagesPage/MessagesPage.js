import React, { useEffect, useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { debounce } from 'lodash'; // Import debounce from lodash
import styles from './MessagesPage.module.css';

const MessagesPage = () => {
  const { user, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);

  const conversationOrderRef = useRef(new Map());
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const userCache = useRef({});
  const userCachePromise = useRef({});
  const messagesIntervalRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const forceScrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 50;
    setIsUserNearBottom(scrollHeight - (scrollTop + clientHeight) < threshold);
  };

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
        const name =
          response.data.name && response.data.name.trim() !== ''
            ? response.data.name
            : userId;
        const userData = {
          username: name,
          picture: validPicture,
        };
        userCache.current[userId] = userData;
        delete userCachePromise.current[userId];
        return userData;
      })
      .catch((error) => {
        console.error(`Failed to fetch details for user ${userId}:`, error);
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

  const fetchAllUserDetails = async (userIds, token) => {
    const uniqueIds = [...new Set(userIds)];
    const promises = uniqueIds.map((id) => fetchUserDetails(id, token));
    return await Promise.all(promises);
  };

  const fetchConversationsDebounced = useRef(
    debounce(async (isPolling = false) => {
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

        const enhancedConvs = data.map((conv) => {
          const otherId =
            conv.user1_id.toLowerCase() === user.sub.toLowerCase() ? conv.user2_id : conv.user1_id;
          const { username, picture } = userIdToDetailsMap[otherId] || {
            username: 'Unknown User',
            picture: 'https://via.placeholder.com/40',
          };
          return {
            ...conv,
            otherUsername: username,
            otherProfilePicture: picture,
            unread_count:
              selectedConversation && conv.conversation_id === selectedConversation.conversation_id
                ? 0
                : conv.unread_count || 0,
          };
        });

        if (
          enhancedConvs.some((conv) => conv.unread_count > 0) ||
          conversationOrderRef.current.size === 0
        ) {
          enhancedConvs.sort((a, b) => b.unread_count - a.unread_count);
          conversationOrderRef.current.clear();
          enhancedConvs.forEach((conv, index) => {
            conversationOrderRef.current.set(conv.conversation_id, index);
          });
        } else {
          enhancedConvs.sort((a, b) => {
            const orderA = conversationOrderRef.current.get(a.conversation_id) ?? Infinity;
            const orderB = conversationOrderRef.current.get(b.conversation_id) ?? Infinity;
            return orderA - orderB;
          });
        }

        setConversations(enhancedConvs);
        setError(null);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations. Please try again later.');
      } finally {
        if (!isPolling) setIsLoadingConversations(false);
      }
    }, 500) // Debounce with 500ms delay
  ).current;

  useEffect(() => {
    if (!authLoading && user && user.sub) {
      fetchConversationsDebounced();
    }
  }, [authLoading, user, getAccessTokenSilently, BACKEND_URL]);

  useEffect(() => {
    if (!authLoading && user && user.sub) {
      const intervalId = setInterval(() => {
        fetchConversationsDebounced(true);
      }, 2000);
      return () => clearInterval(intervalId);
    }
  }, [authLoading, user, getAccessTokenSilently, BACKEND_URL, selectedConversation]);

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
      setError('Failed to load messages. Please try again.');
    } finally {
      if (!isPolling) setIsLoadingMessages(false);
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      const token = await getAccessTokenSilently();
      const url = `${BACKEND_URL}/api/messages/${conversationId}/mark-read`;
      console.log('Marking conversation as read at:', url, 'for user', user.sub);
      const response = await axios.post(
        url,
        { userId: user.sub },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Mark conversation as read response:', response.data);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleSelectConversation = (conv) => {
    setMessages([]);
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c
      )
    );
    setSelectedConversation(conv);
    if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
    fetchMessagesForConversation(conv.conversation_id, false);
    messagesIntervalRef.current = setInterval(() => {
      fetchMessagesForConversation(conv.conversation_id, true);
      markConversationAsRead(conv.conversation_id);
    }, 2000);
  };

  useEffect(() => {
    if (messages.length > 0 && isUserNearBottom) {
      forceScrollToBottom();
    }
  }, [messages, isUserNearBottom]);

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessageContent = (content) => {
    console.log('Rendering content:', content);
    const pathRegex = /(\/feed\?post_id=\d+)/g;
    const parts = content.split(pathRegex);
    console.log('Split parts:', parts);
    return parts.map((part, index) => {
      if (pathRegex.test(part)) {
        return (
          <span
            key={index}
            style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => {
              console.log('Navigating to:', part);
              navigate(part);
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={styles.messagesPage}>
      <div className={styles.history}>
        <h3>Conversations</h3>
        {error && <p className="error-message">{error}</p>}
        {isLoadingConversations ? (
          <div className={styles.spinner}>Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <p>No conversations found. Start chatting!</p>
        ) : (
          <ul>
            {conversations.map((conv) => (
              <li
                key={conv.conversation_id}
                onClick={() => handleSelectConversation(conv)}
                className={
                  selectedConversation?.conversation_id === conv.conversation_id ? styles.active : ''
                }
              >
                <div className={styles.conversationInfo}>
                  <img
                    src={conv.otherProfilePicture || 'https://via.placeholder.com/40'}
                    alt={`Avatar of ${conv.otherUsername}`}
                    className={styles.conversationAvatar}
                  />
                  <div>
                    <p>
                      {conv.otherUsername}
                      {conv.unread_count > 0 && (
                        <span className={styles.unreadBadge}>{conv.unread_count}</span>
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

      <div className={styles.mainContent}>
        {selectedConversation ? (
          <>
            <h3>Chat with {selectedConversation.otherUsername}</h3>
            {isLoadingMessages ? (
              <div className={styles.spinner}>Loading messages...</div>
            ) : (
              <div
                className={styles.messages}
                ref={messagesContainerRef}
                onScroll={handleScroll}
              >
                {messages.map((message) => {
                  const isSent =
                    message.sender_id?.toLowerCase() === user.sub.toLowerCase();
                  return (
                    <div key={message.message_id} className={isSent ? styles.sent : styles.received}>
                      <div className={styles.messageBubble}>
                        <p>{renderMessageContent(message.content)}</p>
                        <span className={styles.messageTime}>
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
            <div className={styles.messageInput}>
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