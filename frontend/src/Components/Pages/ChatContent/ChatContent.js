import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './ChatContent.css';

const ChatContent = () => {
  const { conversation_id } = useParams();
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
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
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < threshold;
    setIsUserNearBottom(isNearBottom);
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

  useEffect(() => {
    setIsFirstLoad(true);
    const initialFetch = async () => {
      await fetchMessages();
    };
    initialFetch();
    const intervalId = setInterval(() => {
      fetchMessages();
    }, 2000);
    return () => clearInterval(intervalId);
  }, [conversation_id, getAccessTokenSilently]);

  useEffect(() => {
    if (messages.length > 0) {
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
      setMessages((prev) => [...prev, response.data]);
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

  // Render message content with clickable links
  const renderMessageContent = (content) => {
    console.log('Rendering content:', content); // Debug log
    const pathRegex = /(\/feed\?post_id=\d+)/g;
    const parts = content.split(pathRegex);
    console.log('Split parts:', parts); // Debug log
    return parts.map((part, index) => {
      if (pathRegex.test(part)) {
        return (
          <span
            key={index}
            style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => {
              console.log('Navigating to:', part); // Debug log
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
    <div className="chat-content">
      <h3>Chat</h3>

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
          const isSent = message.sender_id?.toLowerCase() === user.sub.toLowerCase();
          return (
            <div key={message.message_id} className={isSent ? 'sent' : 'received'}>
              <div className="message-bubble">
                {/* Use renderMessageContent instead of plain content */}
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