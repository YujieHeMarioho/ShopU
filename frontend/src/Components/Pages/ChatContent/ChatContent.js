import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './ChatContent.css';

const PostPreview = ({ post, onClick }) => (
  <div
    className="post-preview"
    onClick={onClick}
    style={{
      border: 'none',
      borderRadius: '12px',
      padding: '15px',
      margin: '10px 0',
      background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
      maxWidth: '400px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column', // Vertical layout
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
  >
    {post.image && (
      <img
        src={post.image}
        alt={post.title || 'Post'}
        style={{
          width: '100%', // Full width of the card
          maxHeight: '200px', // Larger image height
          objectFit: 'cover',
          borderRadius: '8px 8px 0 0', // Rounded only at the top
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '15px', // Space below image
        }}
      />
    )}
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        {post.profile && (
          <img
            src={post.profile}
            alt={post.author || 'Author'}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              marginRight: '10px',
              border: '2px solid #3498db',
            }}
          />
        )}
        <span
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#2980b9',
          }}
        >
          {post.author || 'Unknown Author'}
        </span>
      </div>
      <h4
        style={{
          margin: '0 0 5px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#2c3e50',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
      >
        {post.title || 'Untitled Post'}
      </h4>
      <p
        style={{
          margin: '0',
          fontSize: '14px',
          color: '#7f8c8d',
          lineHeight: '1.4',
        }}
      >
        {post.content ? post.content.substring(0, 70) + '...' : 'No description'}
      </p>
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

  useEffect(() => {
    setIsFirstLoad(true);
    const initialFetch = async () => {
      await fetchMessages();
    };
    initialFetch();
    const intervalId = setInterval(fetchMessages, 2000);
    return () => clearInterval(intervalId);
  }, [conversation_id, getAccessTokenSilently]);

  useEffect(() => {
    if (messages.length > 0) {
      const postIds = messages
        .map((msg) => msg.content.match(/\/feed\?post_id=(\d+)/)?.[1])
        .filter(Boolean);
      console.log('Extracted post IDs:', postIds);
      postIds.forEach((postId) => {
        if (!postCache[postId]) {
          fetchPostMetadata(postId);
        }
      });
      if (isFirstLoad) {
        scrollToBottom();
        setIsFirstLoad(false);
      } else if (isUserNearBottom) {
        scrollToBottom();
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
      setMessages((prev) => [...prev, response.data]); // Fixed syntax
      if (isUserNearBottom) scrollToBottom();
      setNewMessage('');
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

  const renderMessageContent = (content) => {
    const pathRegex = /\/feed\?post_id=(\d+)/g;
    console.log('Content:', content);

    const matches = [...content.matchAll(pathRegex)];
    console.log('Matches:', matches);

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
      console.log('Post ID:', postId, 'Post Data:', postData);
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
      <div
        className="messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc' }}
      >
        {messages.map((message) => {
          const isSent = message.sender_id?.toLowerCase() === user.sub.toLowerCase();
          return (
            <div key={message.message_id} className={isSent ? 'sent' : 'received'}>
              <div className="message-bubble">
                <p>{renderMessageContent(message.content)}</p>
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