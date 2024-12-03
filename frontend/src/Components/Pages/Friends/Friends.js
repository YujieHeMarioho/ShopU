import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './Friends.css';

const Friends = () => {
  const { user, isLoading: authLoading } = useAuth0();
  const [userInfo, setUserInfo] = useState(null);
  const [friends, setFriends] = useState([]);
  const [newFriendId, setNewFriendId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user info and their friends
  useEffect(() => {
    if (!authLoading && user) {
        const fetchUserInfo = async () => {
            try {
                // Get the current user's ID from the backend
                const userResponse = await axios.get(`http://localhost:8080/api/user-id/${user.email}`);
                setUserInfo(userResponse.data);

                // Fetch friends for the current user
                const friendsResponse = await axios.get(`http://localhost:8080/api/friends/${userResponse.data.user_id}`);
                const friendDetails = await Promise.all(
                    friendsResponse.data.map(async (friend) => {
                        const friendResponse = await axios.get(`http://localhost:8080/api/user/${friend.user_id}`);
                        return { ...friend, ...friendResponse.data }; // Merge friend data with profile details
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
}, [authLoading, user]);


  // Add a friend
  const addFriend = async () => {
    if (!newFriendId) {
      alert('Please enter a valid Friend ID.');
      return;
    }
  
    // Prevent adding the same friend twice in the frontend
    if (friends.some(friend => friend.user_id === parseInt(newFriendId))) {
      alert('Friendship already exists.');
      setNewFriendId(''); // Clear input field
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:8080/api/friends', {
        user_id: userInfo.user_id,
        friend_id: parseInt(newFriendId),
      });
      alert(response.data.message); // Success message
      setNewFriendId(''); // Clear input field
  
      // Fetch the updated friends list with profile details
      const friendsResponse = await axios.get(`http://localhost:8080/api/friends/${userInfo.user_id}`);
      const friendDetails = await Promise.all(
        friendsResponse.data.map(async (friend) => {
          const friendResponse = await axios.get(`http://localhost:8080/api/user/${friend.user_id}`);
          return { ...friend, ...friendResponse.data };
        })
      );
      setFriends(friendDetails); // Update state with full details
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Error adding friend.');
    }
  };
  

  // Remove a friend
  const removeFriend = async (friendId) => {
    try {
      const response = await axios.delete(`http://localhost:8080/api/friends/${userInfo.user_id}/${friendId}`);
      alert(response.data.message);
  
      // Fetch the updated friends list with profile details
      const friendsResponse = await axios.get(`http://localhost:8080/api/friends/${userInfo.user_id}`);
      const friendDetails = await Promise.all(
        friendsResponse.data.map(async (friend) => {
          const friendResponse = await axios.get(`http://localhost:8080/api/user/${friend.user_id}`);
          return { ...friend, ...friendResponse.data };
        })
      );
      setFriends(friendDetails); // Update state with full details
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Error removing friend.');
    }
  };
  

  if (isLoading) {
    return <div className="loading">Loading user information...</div>;
  }

  if (!userInfo) {
    return <div className="error">Error: Unable to load user information.</div>;
  }

  return (
    <div className="friends-container">
      <h1 className="page-title">Friends Management</h1>

      {/* Display Current User Info */}
      <div className="current-user-card">
        <img
          src={userInfo.profile_picture || 'https://via.placeholder.com/150'}
          alt="Profile"
          className="current-user-avatar"
        />
        <div className="current-user-info">
          <h2>{userInfo.name || 'No Name Provided'}</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {userInfo.user_id}</p>
        </div>
      </div>

      {/* Add Friend Section */}
      <div className="add-friend-section">
        <h2>Add a New Friend</h2>
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
      <div className="friends-grid">
    <h2>Your Friends</h2>
    {friends.length === 0 ? (
        <p>You have no friends yet. Add some friends to get started!</p>
    ) : (
        friends.map((friend) => (
            <div key={friend.user_id} className="friend-card">
                <img
                    src={friend.profile_picture || 'https://via.placeholder.com/100'}
                    alt={friend.user_id}
                    className="friend-avatar"
                />
                <div className="friend-info">
                    <h3>{friend.name || `User ${friend.user_id}`}</h3>
                    <p><strong>Email:</strong> {friend.edu_email}</p>
                    <p>Friended At: {new Date(friend.friended_at).toLocaleString()}</p>
                </div>
                <button className="delete-button" onClick={() => removeFriend(friend.user_id)}>
                    Remove Friend
                </button>
            </div>
        ))
    )}
    </div>

    </div>
  );
};

export default Friends;
