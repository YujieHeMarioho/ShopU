import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { debounce } from 'lodash';
import styles from './MessagesPage.module.css';

// PostPreview component for shared posts from feed
const PostPreview = ({ post, onClick }) => (
  <div className={styles.postPreview} onClick={onClick}>
    {post.image && (
      <img src={post.image} alt={post.title || 'Post'} />
    )}
    <div style={{ textAlign: 'left' }}>
      <div className={styles.authorContainer}>
        {post.profile && (
          <img src={post.profile} alt={post.author || 'Author'} />
        )}
        <span>{post.author || 'Unknown Author'}</span>
      </div>
      <h4>{post.title || 'Untitled Post'}</h4>
      <p>{post.content ? post.content.substring(0, 70) + '...' : 'No description'}</p>
    </div>
  </div>
);

// OfferCard component for marketplace listings
const OfferCard = ({ listing, offerPrice, onClick }) => (
  <div className={styles.postPreview} onClick={onClick}>
    {listing.file_keys && listing.file_keys[0] && (
      <img src={listing.file_keys[0]} alt={listing.title || 'Listing'} />
    )}
    <div style={{ textAlign: 'left' }}>
      <div className={styles.authorContainer}>
        {listing.profile && (
          <img src={listing.profile} alt={listing.author || 'Seller'} />
        )}
        <span>{listing.author || 'Unknown Seller'}</span>
      </div>
      <h4>{listing.title || 'Untitled Listing'}</h4>
      <p>Offered Price: ${offerPrice}</p>
    </div>
  </div>
);

const MessagesPage = () => {
  const { user, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const navigate = useNavigate();

  const [displayedConversations, setDisplayedConversations] = useState([]);
  const [conversationsData, setConversationsData] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const [postCache, setPostCache] = useState({});
  const [listingCache, setListingCache] = useState({});

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
        const validPicture = pictureFromAPI && pictureFromAPI.trim() !== '' ? pictureFromAPI : 'https://via.placeholder.com/40';
        const name = response.data.name && response.data.name.trim() !== '' ? response.data.name : userId;
        const userData = { username: name, picture: validPicture };
        userCache.current[userId] = userData;
        delete userCachePromise.current[userId];
        return userData;
      })
      .catch((error) => {
        console.error(`Failed to fetch details for user ${userId}:`, error);
        const fallback = { username: userId, picture: 'https://via.placeholder.com/40' };
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

  const fetchPostMetadata = async (postId) => {
    if (postCache[postId]) return postCache[postId];
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(
        `${BACKEND_URL}/api/feed/post/${postId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const postData = response.data;
      console.log(`Fetched post ${postId}:`, postData);
      setPostCache((prev) => ({ ...prev, [postId]: postData }));
      return postData;
    } catch (error) {
      console.error(`Error fetching post metadata for post_id ${postId}:`, error);
      return null;
    }
  };

  const fetchListingMetadata = async (listingId) => {
    if (listingCache[listingId]) {
      console.log(`Cache hit for listing ${listingId}:`, listingCache[listingId]);
      return listingCache[listingId];
    }
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(
        `${BACKEND_URL}/api/listings/${listingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const listingData = response.data;
      console.log(`Fetched listing ${listingId}:`, listingData);
      setListingCache((prev) => ({ ...prev, [listingId]: listingData }));
      return listingData;
    } catch (error) {
      console.error(`Error fetching listing metadata for listing_id ${listingId}:`, error);
      return null;
    }
  };

  const fetchConversationsDebounced = useRef(
    debounce(async (isInitialLoad = false) => {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get(
          `${BACKEND_URL}/api/messages/conversations/${encodeURIComponent(user.sub)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = response.data;

        const otherUserIds = data.map((conv) =>
          conv.user1_id.toLowerCase() === user.sub.toLowerCase() ? conv.user2_id : conv.user1_id
        );
        const userDetailsList = await fetchAllUserDetails(otherUserIds, token);
        const uniqueIds = [...new Set(otherUserIds)];
        const userIdToDetailsMap = {};
        uniqueIds.forEach((id, idx) => {
          userIdToDetailsMap[id] = userDetailsList[idx];
        });

        const timestampPromises = data.map(async (conv) => {
          const response = await axios.get(
            `${BACKEND_URL}/api/messages/${conv.conversation_id}/messages`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const messages = response.data;
          const latestMessage = messages.length > 0
            ? messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
            : null;
          return {
            conversation_id: conv.conversation_id,
            timestamp: latestMessage ? latestMessage.created_at : null,
          };
        });
        const timestamps = await Promise.all(timestampPromises);
        const timestampMap = timestamps.reduce((acc, { conversation_id, timestamp }) => {
          acc[conversation_id] = timestamp;
          return acc;
        }, {});

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
            last_message_timestamp: timestampMap[conv.conversation_id] || null,
          };
        });

        enhancedConvs.sort((a, b) => {
          const timeA = a.last_message_timestamp ? new Date(a.last_message_timestamp).getTime() : 0;
          const timeB = b.last_message_timestamp ? new Date(b.last_message_timestamp).getTime() : 0;
          return timeB - timeA;
        });

        if (isInitialLoad) {
          setDisplayedConversations(enhancedConvs);
        }
        setConversationsData(enhancedConvs);
        setError(null);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations. Please try again later.');
      } finally {
        if (isInitialLoad) setIsLoadingConversations(false);
      }
    }, 500)
  ).current;

  useEffect(() => {
    if (!authLoading && user && user.sub) {
      fetchConversationsDebounced(true);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!authLoading && user && user.sub) {
      const intervalId = setInterval(() => {
        fetchConversationsDebounced(false);
      }, 2000);
      return () => clearInterval(intervalId);
    }
  }, [authLoading, user]);

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

      const postIds = response.data
        .map((msg) => msg.content.match(/\/feed\?post_id=(\d+)/)?.[1])
        .filter(Boolean);
      const listingIds = response.data
        .map((msg) => msg.content.match(/http:\/\/localhost:3000\/marketplace\?listingId=(\d+)/)?.[1])
        .filter(Boolean);

      if (postIds.length > 0) {
        await Promise.all(postIds.map((id) => fetchPostMetadata(id)));
      }
      if (listingIds.length > 0) {
        await Promise.all(listingIds.map((id) => fetchListingMetadata(id)));
      }
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
      await axios.post(
        `${BACKEND_URL}/api/messages/${conversationId}/mark-read`,
        { userId: user.sub },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleSelectConversation = (conv) => {
    setMessages([]);
    setDisplayedConversations((prev) =>
      prev.map((c) =>
        c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c
      )
    );
    setConversationsData((prev) =>
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

      const postIds = [newMessage.match(/\/feed\?post_id=(\d+)/)?.[1]].filter(Boolean);
      const listingIds = [newMessage.match(/http:\/\/localhost:3000\/marketplace\?listingId=(\d+)/)?.[1]].filter(Boolean);

      if (postIds.length > 0) {
        await Promise.all(postIds.map((id) => fetchPostMetadata(id)));
      }
      if (listingIds.length > 0) {
        await Promise.all(listingIds.map((id) => fetchListingMetadata(id)));
      }

      fetchConversationsDebounced(false);
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

  const renderMessageContent = (message) => {
    const { content, offer_price } = message;

    const feedRegex = /\/feed\?post_id=(\d+)/g;
    const marketplaceRegex = /http:\/\/localhost:3000\/marketplace\?listingId=(\d+)/g;

    const marketplaceMatch = content.match(marketplaceRegex);
    if (marketplaceMatch) {
      const fullUrl = marketplaceMatch[0];
      const listingId = fullUrl.match(/listingId=(\d+)/)[1];
      const listing = listingCache[listingId] || {};
      const parts = content.split(fullUrl);
      return parts.map((part, index) => {
        if (index === parts.length - 1 && part === '') return null;
        return (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index === 0 && (
              <OfferCard
                listing={listing}
                offerPrice={offer_price || 'N/A'}
                onClick={() => navigate(`/marketplace?listingId=${listingId}`)}
              />
            )}
          </React.Fragment>
        );
      });
    }

    const feedMatches = [...content.matchAll(feedRegex)];
    if (!feedMatches.length) {
      return <span>{content}</span>;
    }

    let lastIndex = 0;
    const elements = [];
    feedMatches.forEach((match, i) => {
      const fullMatch = match[0];
      const postId = match[1];
      const startIndex = match.index;

      if (startIndex > lastIndex) {
        elements.push(<span key={`text-${i}`}>{content.slice(lastIndex, startIndex)}</span>);
      }

      const postData = postCache[postId];
      elements.push(
        postData ? (
          <PostPreview
            key={`preview-${i}`}
            post={postData}
            onClick={() => navigate(`/feed?post_id=${postId}`)}
          />
        ) : (
          <span key={`loading-${i}`}>Loading preview...</span>
        )
      );

      lastIndex = startIndex + fullMatch.length;
    });

    if (lastIndex < content.length) {
      elements.push(<span key="text-end">{content.slice(lastIndex)}</span>);
    }
    return elements;
  };

  const conversationList = useMemo(() => {
    return displayedConversations.length === 0 ? (
      <p>No conversations found. Start chatting!</p>
    ) : (
      <ul>
        {displayedConversations.map((conv) => (
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
    );
  }, [displayedConversations, selectedConversation]);

  return (
    <div>
      <button className={styles.switchButton} onClick={() => navigate('/groupchats')}>View Your Community Chats</button>
      <div className={styles.messagesPage}>
        <div className={styles.history}>
          <h3>Conversations</h3>
          {error && <p className="error-message">{error}</p>}
          {isLoadingConversations ? (
            <div className={styles.spinner}>Loading conversations...</div>
          ) : (
            conversationList
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
                          <p>{renderMessageContent(message)}</p>
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
    </div>
  );
};

export default MessagesPage;