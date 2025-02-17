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

  // Tracks whether we've done the "initial" fetch for this conversation
  // so we can scroll to bottom only on that first load
  const [isFirstLoad, setIsFirstLoad] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const userCache = useRef({});

  const messagesContainerRef = useRef(null);

  // ------------------ SCROLL HELPERS ------------------
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // ------------------ FETCH CONVERSATIONS ------------------
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      try {
        const token = await getAccessTokenSilently();
        const res = await axios.get(
          `${BACKEND_URL}/api/messages/conversations/${encodeURIComponent(user.sub)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const conversationsData = res.data;

        // Identify the other participant in each conversation
        const otherUserIds = conversationsData.map((conv) =>
          conv.user1_id.toLowerCase() === user.sub.toLowerCase()
            ? conv.user2_id
            : conv.user1_id
        );

        // Deduplicate
        const uniqueOtherUserIds = [...new Set(otherUserIds)];

        // Fetch each user's detail
        const userDetailsPromises = uniqueOtherUserIds.map((id) =>
          fetchUserDetails(id, token)
        );
        const userDetails = await Promise.all(userDetailsPromises);

        // Map userId -> details
        const userIdToDetailsMap = {};
        uniqueOtherUserIds.forEach((id, idx) => {
          userIdToDetailsMap[id] = userDetails[idx];
        });

        // Enhance each conversation
        const enhanced = conversationsData.map((conv) => {
          const otherUserId =
            conv.user1_id.toLowerCase() === user.sub.toLowerCase()
              ? conv.user2_id
              : conv.user1_id;

          const { username, picture } = userIdToDetailsMap[otherUserId] || {
            username: 'Unknown User',
            picture: 'https://via.placeholder.com/40',
          };

          return {
            ...conv,
            otherUserId,
            otherUsername: username,
            otherProfilePicture: picture,
          };
        });

        setConversations(enhanced);
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
  }, [user, getAccessTokenSilently, authLoading, BACKEND_URL]);

  // ------------------ FETCH MESSAGES (CALLED DURING POLLING) ------------------
  const fetchMessages = async () => {
    if (!selectedConversation) return;

    try {
      // We only show spinner if isFirstLoad===true
      if (isFirstLoad) {
        setIsLoadingMessages(true);
      }
      const token = await getAccessTokenSilently();
      const res = await axios.get(
        `${BACKEND_URL}/api/messages/${encodeURIComponent(
          selectedConversation.conversation_id
        )}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(res.data);
      setError(null);

      // If it's the first load, scroll to bottom
      if (isFirstLoad) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again later.');
    } finally {
      if (isFirstLoad) {
        setIsFirstLoad(false); // future polls won't scroll
        setIsLoadingMessages(false);
      }
    }
  };

  // ------------------ WATCH SELECTED CONVERSATION / POLLING ------------------
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    // Mark that we just switched to a new conversation => do first load logic
    setIsFirstLoad(true);

    // 1) Immediately fetch once
    fetchMessages();

    // 2) Then poll
    const intervalId = setInterval(() => {
      fetchMessages(); // no forced scroll after the first time
    }, 2000);

    return () => clearInterval(intervalId);

  }, [selectedConversation]);

  // ------------------ SEND MESSAGE (ALWAYS SCROLL AFTER YOU SEND) ------------------
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(
        `${BACKEND_URL}/api/messages/${encodeURIComponent(
          selectedConversation.conversation_id
        )}/messages`,
        { senderId: user.sub, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Optimistic update
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
      setError(null);

      // Scroll to bottom so you see your new message
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  // ------------------ ENTER KEY TO SEND ------------------
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ------------------ FETCH USER DETAILS (CACHED) ------------------
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
    } catch (err) {
      console.error(`Error fetching user details for ${userId}:`, err);
      const fallbackData = {
        username: userId,
        picture: 'https://via.placeholder.com/40',
      };
      userCache.current[userId] = fallbackData;
      return fallbackData;
    }
  };

  // ------------------ RENDER ------------------
  return (
    <div className="messages-page">
      {/* LEFT COLUMN: Conversation List */}
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
                      conv.otherProfilePicture || 'https://via.placeholder.com/40'
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

      {/* RIGHT COLUMN: Messages + input */}
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
