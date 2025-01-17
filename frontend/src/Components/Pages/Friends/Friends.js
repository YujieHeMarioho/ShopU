import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './Friends.css';

const Friends = () => {
  const { user, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const [friends, setFriends] = useState([]);
  const [newFriendId, setNewFriendId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user info and their friends
  useEffect(() => {
    if (!authLoading && user) {
      const fetchUserInfo = async () => {
        try {
          const token = await getAccessTokenSilently();
          // Fetch friends for the current user
          const friendsResponse = await axios.get(`http://localhost:8080/api/friends`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            }
          );
          const friendDetails = await Promise.all(
            friendsResponse.data.map(async (friend) => {

              const friendResponse = await axios.get(`http://localhost:8080/api/user/${friend.friend_id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  }
                }
              );
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
    if (friends.some(friend => friend.user_id === newFriendId)) {
      alert('Friendship already exists.');
      setNewFriendId(''); // Clear input field
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(`http://localhost:8080/api/friends`,
        {
          friend_id: newFriendId,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      alert(response.data.message); // Success message
      setNewFriendId(''); // Clear input field

      // Fetch the updated friends list with profile details
      const friendsResponse = await axios.get(`http://localhost:8080/api/friends`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      const friendDetails = await Promise.all(
        friendsResponse.data.map(async (friend) => {
          const token = await getAccessTokenSilently();
          const friendResponse = await axios.get(`http://localhost:8080/api/user/${friend.user_id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            }
          );
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
      const token = await getAccessTokenSilently();
      const response = await axios.delete(`http://localhost:8080/api/friends/${friendId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      alert(response.data.message);

      // Fetch the updated friends list with profile details
      const friendsResponse = await axios.get(`http://localhost:8080/api/friends`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      const friendDetails = await Promise.all(
        friendsResponse.data.map(async (friend) => {
          const friendResponse = await axios.get(`http://localhost:8080/api/user/${friend.user_id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            }
          );
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

  if (!user) {
    return <div className="error">Error: Unable to load user information.</div>;
  }

  return (
    <div className="friends-container">
      <h1 className="page-title">Friends Management</h1>

      {/* Display Current User Info */}
      <div className="current-user-card">
        <img
          src={user.profile_picture || 'https://via.placeholder.com/150'}
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
                <p><strong>Email:</strong> {friend.email}</p>
                <p>Friended At: {new Date(friend.friended_at).toLocaleString()}</p>
              </div>
              <button className="delete-button" onClick={() => removeFriend(friend.friend_id)}>
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
