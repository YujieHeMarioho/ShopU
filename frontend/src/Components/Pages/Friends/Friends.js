import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './Friends.css';

const Friends = () => {
  const { user, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const [friends, setFriends] = useState([]);
  const [newFriendId, setNewFriendId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      const fetchUserInfo = async () => {
        try {
          const token = await getAccessTokenSilently();
          const friendsResponse = await axios.get(`http://localhost:8080/api/friends`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const friendDetails = await Promise.all(
            friendsResponse.data.map(async (friend) => {
              const friendResponse = await axios.get(
                `http://localhost:8080/api/user/${friend.friend_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return { ...friend, ...friendResponse.data };
            })
          );

          setFriends(friendDetails);
        } catch (error) {
          console.error('Error fetching user info or friends:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserInfo();
    }
  }, [authLoading, user, getAccessTokenSilently]);

  const addFriend = async () => {
    if (!newFriendId) {
      alert('Please enter a valid Friend ID.');
      return;
    }
  
    if (friends.some((friend) => friend.user_id === newFriendId)) {
      alert('Friendship already exists.');
      setNewFriendId('');
      return;
    }
  
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `http://localhost:8080/api/friends`,
        { friend_id: newFriendId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      alert(response.data.message);
      setNewFriendId('');
  
      // Fetch the new friend's details and add to the state
      const friendResponse = await axios.get(
        `http://localhost:8080/api/user/${newFriendId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setFriends((prevFriends) => [
        ...prevFriends,
        { ...friendResponse.data, friend_id: newFriendId },
      ]);
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Error adding friend.');
    }
  };
  
  

  const removeFriend = async (friendId) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.delete(
        `http://localhost:8080/api/friends/${friendId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      alert(response.data.message);
  
      // Update the state by filtering out the removed friend
      setFriends((prevFriends) => prevFriends.filter((friend) => friend.user_id !== friendId));
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Error removing friend.');
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
              <div key={friend.user_id} className="friend-card">
                <img
                  src={friend.profile_picture || 'https://via.placeholder.com/100'}
                  alt={friend.user_id}
                  className="friend-avatar"
                />
                <div className="friend-info">
                  <h3>{friend.name || `User ${friend.user_id}`}</h3>
                  <p><strong>Email:</strong> {friend.email}</p>
                  <p><strong>Friended At:</strong> {new Date(friend.friended_at).toLocaleString()}</p>
                </div>
                <button className="delete-button" onClick={() => removeFriend(friend.friend_id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
