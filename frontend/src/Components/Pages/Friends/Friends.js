import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Friends.css';

const Friends = () => {
  const { user, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const [friends, setFriends] = useState([]);
  const [newFriendId, setNewFriendId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      const fetchUserInfo = async () => {
        try {
          const token = await getAccessTokenSilently();
          console.log('Access Token:', token);

          const friendsResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/api/friends`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: { user_id: user.sub },
            }
          );

          console.log('Friends Response:', friendsResponse.data);

          const friendDetails = await Promise.all(
            friendsResponse.data.map(async (friend) => {
              try {
                const friendResponse = await axios.get(
                  `${process.env.REACT_APP_BACKEND_URL}/api/user/${encodeURIComponent(friend.friend_id)}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log(`Friend ${friend.friend_id} Details:`, friendResponse.data);
                return { 
                  ...friend, 
                  username: friendResponse.data.username, 
                  email: friendResponse.data.email, // Include email
                  profile_picture: friendResponse.data.picture 
                };
              } catch (error) {
                console.error(`Error fetching data for friend_id ${friend.friend_id}:`, error.response ? error.response.data : error.message);
                return { 
                  ...friend, 
                  username: 'Unknown User', 
                  email: 'No Email Provided', // Fallback for email
                  profile_picture: 'https://via.placeholder.com/100' 
                };
              }
            })
          );

          console.log('Merged Friend Details:', friendDetails);
          setFriends(friendDetails);
        } catch (error) {
          console.error('Error fetching user info or friends:', error.response ? error.response.data : error.message);
          alert('Failed to load friends. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserInfo();
    }
  }, [authLoading, user, getAccessTokenSilently]);

  const addFriend = async () => {
    if (!newFriendId.trim()) {
      alert('Please enter a valid Friend ID.');
      return;
    }

    if (friends.some((friend) => friend.friend_id === newFriendId.trim())) {
      alert('Friendship already exists.');
      setNewFriendId('');
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/friends`,
        { friend_id: newFriendId.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Add Friend Response:', response.data);
      alert(response.data.message);
      setNewFriendId('');

      // Fetch the new friend's details and add to the state
      const friendResponse = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/user/${encodeURIComponent(newFriendId.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(`New Friend ${newFriendId.trim()} Details:`, friendResponse.data);

      setFriends((prevFriends) => [
        ...prevFriends,
        { 
          ...friendResponse.data, 
          friend_id: newFriendId.trim(), 
          email: friendResponse.data.email, // Include email
          profile_picture: friendResponse.data.picture, 
          username: friendResponse.data.username,
          friended_at: new Date().toISOString() // Assuming current time
        },
      ]);
    } catch (error) {
      console.error('Error adding friend:', error.response ? error.response.data : error.message);
      alert('Error adding friend.');
    }
  };

  const removeFriend = async (friendId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this friend? This action cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      console.log('Removing Friend ID:', friendId);

      const token = await getAccessTokenSilently();
      const response = await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/friends/${encodeURIComponent(friendId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Remove Friend Response:', response.data);
      alert(response.data.message);

      setFriends((prevFriends) => prevFriends.filter((friend) => friend.friend_id !== friendId));
    } catch (error) {
      console.error('Error removing friend:', error.response ? error.response.data : error.message);
      alert('Error removing friend.');
    }
  };

  // Handle Message button click
  const handleMessage = async (friendId) => {
    try {
      console.log('Starting conversation with:', friendId);
      const token = await getAccessTokenSilently();
      console.log('Access token fetched:', token);

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/conversations`,
        { user1_id: user.sub, user2_id: friendId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Conversation Created:', response.data);
      navigate(`/chat/${response.data.conversation_id}`);
      console.log('Navigated to chat page for conversation ID:', response.data.conversation_id);
    } catch (error) {
      console.error('Error starting conversation:', error.response ? error.response.data : error.message);
      alert('Unable to start a conversation. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="loading">Loading user information...</div>;
  }

  if (!user) {
    return <div className="error">Error: Unable to load user information.</div>;
  }

  return (
    <div className="friends-container">
      <h1 className="page-title">Friends</h1>

      {/* Display Current User Info */}
      <div className="current-user-card">
        <img
          src={user.picture || 'https://via.placeholder.com/150'}
          alt="Profile"
          className="current-user-avatar"
        />
        <div className="current-user-info">
          <h2>{user.name || 'No Name Provided'}</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.sub}</p>
        </div>
      </div>

      {/* Add Friend Section */}
      <div className="add-friend-section">
        <h2>Add a Friend</h2>
        <div className="add-friend-form">
          <input
            type="text"
            placeholder="Enter Friend ID"
            value={newFriendId}
            onChange={(e) => setNewFriendId(e.target.value)}
          />
          <button onClick={addFriend}>Add Friend</button>
        </div>
      </div>

      {/* Friends List */}
      <div className="friends-list-section">
        <h2>Your Friends</h2>
        {friends.length === 0 ? (
          <p className="no-friends">You have no friends yet. Add some friends to get started!</p>
        ) : (
          <div className="friends-grid">
            {friends.map((friend) => (
              <div key={friend.friend_id} className="friend-card">
                <img
                  src={friend.profile_picture || 'https://via.placeholder.com/100'}
                  alt={friend.username || `User ${friend.friend_id}`}
                  className="friend-avatar"
                />
                <div className="friend-info">
                  <h3>{friend.username || `User ${friend.friend_id}`}</h3>
                  <p><strong>Friended At:</strong> {new Date(friend.friended_at).toLocaleString()}</p>
                </div>
                <div className="friend-actions">
                  <button
                    className="message-button"
                    onClick={() => handleMessage(friend.friend_id)}
                  >
                    Message
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => removeFriend(friend.friend_id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
