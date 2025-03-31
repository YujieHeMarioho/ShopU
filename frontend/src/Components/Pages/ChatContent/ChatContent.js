import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './ChatContent.css';

const PostPreview = ({ post, onClick }) => (
  <div className="post-preview" onClick={onClick}>
    {post.image && (
      <img src={post.image} alt={post.title || 'Post'} />
    )}
    <div style={{ textAlign: 'left' }}>
      <div className="author-container">
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

const OfferCard = ({ listing, offerPrice, onClick }) => (
  <div className="post-preview" onClick={onClick}>
    {listing.file_keys && listing.file_keys[0] && (
      <img src={listing.file_keys[0]} alt={listing.title || 'Listing'} />
    )}
    <div style={{ textAlign: 'left' }}>
      <div className="author-container">
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

const ChatContent = () => {
  const { conversation_id } = useParams();
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const [postCache, setPostCache] = useState({});
  const [listingCache, setListingCache] = useState({});
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 50;
    setIsUserNearBottom(scrollHeight - (scrollTop + clientHeight) < threshold);
  };

  const fetchMessages = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/messages/${conversation_id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Fetched messages full response:', response.data);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchPostMetadata = async (postId) => {
    if (postCache[postId]) {
      console.log(`Cache hit for post ${postId}:`, postCache[postId]);
      return postCache[postId];
    }
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/feed/post/${postId}`,
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
        `${process.env.REACT_APP_BACKEND_URL}/api/listings/${listingId}`,
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

  useEffect(() => {
    setIsFirstLoad(true);
    const initialFetch = async () => {
      await fetchMessages();
    };
    initialFetch();
    const intervalId = setInterval(fetchMessages, 2000);
    return () => clearInterval(intervalId);
  }, [conversation_id]);

  useEffect(() => {
    if (messages.length > 0) {
      const postIds = messages
        .map((msg) => msg.content.match(/\/feed\?post_id=(\d+)/)?.[1])
        .filter(Boolean);
      const listingIds = messages
        .map((msg) => msg.content.match(/http:\/\/localhost:3000\/marketplace\?listingId=(\d+)/)?.[1])
        .filter(Boolean);

      if (postIds.length > 0) {
        postIds.forEach((postId) => {
          if (!postCache[postId]) {
            fetchPostMetadata(postId);
          }
        });
      }

      if (listingIds.length > 0) {
        console.log('Fetching listings for IDs:', listingIds);
        listingIds.forEach((listingId) => {
          if (!listingCache[listingId]) {
            console.log('Calling fetchListingMetadata for:', listingId);
            fetchListingMetadata(listingId);
          }
        });
      }

      if (isFirstLoad || isUserNearBottom) {
        scrollToBottom();
      }
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    }
  }, [messages, isFirstLoad, isUserNearBottom]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/messages/${conversation_id}/messages`,
        { senderId: user.sub, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
      scrollToBottom(); // Always scroll to bottom after sending
    } catch (error) {
      console.error('Error sending message:', error);
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
    console.log('Rendering content:', content);

    const feedRegex = /\/feed\?post_id=(\d+)/g;
    const marketplaceRegex = /http:\/\/localhost:3000\/marketplace\?listingId=(\d+)/g;

    const marketplaceMatch = content.match(marketplaceRegex);
    if (marketplaceMatch) {
      const fullUrl = marketplaceMatch[0];
      const listingId = fullUrl.match(/listingId=(\d+)/)[1];
      const listing = listingCache[listingId] || {};
      const parts = content.split(fullUrl);
      return parts.map((part, index) => {
        if (index === parts.length - 1 && part === '') {
          return null;
        }
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

    const matches = [...content.matchAll(feedRegex)];
    if (!matches.length) {
      return <span>{content}</span>;
    }

    let lastIndex = 0;
    const elements = [];
    matches.forEach((match, i) => {
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

  return (
    <div className="chat-content">
      <h3>Chat</h3>
      <div className="messages" ref={messagesContainerRef} onScroll={handleScroll}>
        {messages.map((message) => {
          const isSent = message.sender_id?.toLowerCase() === user.sub.toLowerCase();
          return (
            <div key={message.message_id} className={isSent ? 'sent' : 'received'}>
              <div className="message-bubble">
                <p>{renderMessageContent(message)}</p>
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
    </div>
  );
};

export default ChatContent;