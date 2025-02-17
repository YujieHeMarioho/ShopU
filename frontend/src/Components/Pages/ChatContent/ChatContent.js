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

  // We'll use this to decide if we should auto-scroll *once* on the very first load
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const messagesContainerRef = useRef(null);

  // --- 1) Helper: scroll to bottom of the container ---
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // --- 2) Fetch messages, optionally auto-scroll the first time ---
  const fetchMessages = async (firstTime = false) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/messages/${conversation_id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);

      // If this is the first load, scroll once after everything is rendered
      if (firstTime) {
        setTimeout(() => {
          scrollToBottom();
          setIsFirstLoad(false); // all future polls won't scroll
        }, 100); // a small delay so the DOM can paint
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // --- 3) On mount (or when conversation_id changes), do first-load fetch + polling ---
  useEffect(() => {
    // Whenever conversation changes, reset "isFirstLoad"
    setIsFirstLoad(true);

    const initialFetch = async () => {
      // On the first fetch, we pass `true` so we scroll once
      await fetchMessages(true);
    };

    initialFetch();

    // Then poll every 2 seconds, passing `false` to skip auto-scrolling
    const intervalId = setInterval(() => {
      fetchMessages(false);
    }, 2000);

    // Cleanup
    return () => clearInterval(intervalId);

  }, [conversation_id, getAccessTokenSilently]);

  // --- 4) Send a new message (we WILL scroll here) ---
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

      // Always scroll so the sender sees their new message
      scrollToBottom();

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // --- 5) Press Enter to send ---
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
        style={{
          height: '400px',      // or '60vh', etc.
          overflowY: 'auto',
          border: '1px solid #ccc'
        }}
      >
        {messages.map((message) => {
          const isSent = message.sender_id.toLowerCase() === user.sub.toLowerCase();
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
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatContent;
