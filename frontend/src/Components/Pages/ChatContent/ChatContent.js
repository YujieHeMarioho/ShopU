import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './ChatContent.css';

const ChatContent = () => {
  const { conversation_id } = useParams();
  const { user, getAccessTokenSilently } = useAuth0();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Flag to ensure we always scroll on the very first load
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Track if user is near the bottom of the scrollable container
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);

  const messagesContainerRef = useRef(null);

  // -----------------------------
  // Force scroll to bottom
  // -----------------------------
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // -----------------------------
  // Handle scroll (detect if user is near bottom)
  // -----------------------------
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Adjust threshold as needed
    const threshold = 50;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < threshold;

    setIsUserNearBottom(isNearBottom);
  };

  // -----------------------------
  // Fetch messages from backend
  // -----------------------------
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

  // -----------------------------
  // Whenever conversation_id changes, reset and start polling
  // -----------------------------
  useEffect(() => {
    setIsFirstLoad(true); // Ensure we scroll on first load for new conversation

    const initialFetch = async () => {
      await fetchMessages();
    };

    initialFetch();

    // Poll every 2 seconds
    const intervalId = setInterval(() => {
      fetchMessages();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [conversation_id, getAccessTokenSilently]);

  // -----------------------------
  // Scroll behavior after messages update
  // -----------------------------
  useEffect(() => {
    if (messages.length > 0) {
      // On the very first load, always scroll to bottom
      if (isFirstLoad) {
        scrollToBottom();
        setIsFirstLoad(false);
      }
      // Otherwise, scroll ONLY if user is near bottom
      else if (isUserNearBottom) {
        scrollToBottom();
      }
    }
  }, [messages, isFirstLoad, isUserNearBottom]);

  // -----------------------------
  // Send a message
  // -----------------------------
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/messages/${conversation_id}/messages`,
        { senderId: user.sub, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Optimistic update
      setMessages((prev) => [...prev, response.data]);

      // After sending, only scroll if user was near bottom
      if (isUserNearBottom) {
        scrollToBottom();
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // -----------------------------
  // Send message on Enter (no Shift)
  // -----------------------------
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
