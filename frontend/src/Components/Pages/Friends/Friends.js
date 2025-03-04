import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {Link, useNavigate} from 'react-router-dom';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import axios from 'axios';
import styles from './Friends.module.css';

const Friends = () => {
  const { user, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userOptions, setUserOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState([]);

  const navigate = useNavigate();

  // -------------------------------
  // 1) Fetch friend list + details
  // -------------------------------
  const fetchUserInfo = async () => {
    try {
      const token = await getAccessTokenSilently();

      // A) Get raw friend relationships
      const friendsResponse = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/friends`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { user_id: user.sub },
        }
      );
      console.log('Friends Response:', friendsResponse.data);

      // B) For each friend, fetch user info from local DB or /api/user
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
              name: friendResponse.data.name || 'Unknown User',
              email: friendResponse.data.email || 'No Email Provided',
              profile_picture: friendResponse.data.picture || 'https://via.placeholder.com/100',
            };
          } catch (error) {
            console.error(
              `Error fetching data for friend_id ${friend.friend_id}:`,
              error.response ? error.response.data : error.message
            );
            // Fallback
            return {
              ...friend,
              name: 'Unknown User',
              email: 'No Email Provided',
              profile_picture: 'https://via.placeholder.com/100',
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

  // 2) On mount or when user changes, load friend list
  useEffect(() => {
    if (!authLoading && user) {
      fetchUserInfo();
    }
  }, [authLoading, user, getAccessTokenSilently]);

  // -------------------------------
  // 3) Search users to add friend
  // -------------------------------
  const searchUsers = async (query) => {
    if (query.length < 2) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { query },
      });
      setUserOptions(
        response.data.map((u) => ({
          id: u.id,
          label: u.name,
        }))
      );
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // -------------------------------
  // 4) Add a friend
  // -------------------------------
  const addFriend = async () => {
    if (selectedUser.length === 0) {
      alert('Please select a user to add as a friend.');
      return;
    }
    const newFriend = selectedUser[0];

    if (friends.some((f) => f.friend_id === newFriend.id)) {
      alert('Friendship already exists.');
      setSelectedUser([]);
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/friends`,
        { friend_id: newFriend.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Add Friend Response:', response.data);
      alert(response.data.message);

      // 4A) ***Instead of manually fetching new friend data from Auth0***
      //     ***Just re-run fetchUserInfo to refresh entire friend list***
      await fetchUserInfo(); // <= This forces the updated friend list

      // Clear the selection
      setSelectedUser([]);
    } catch (error) {
      console.error('Error adding friend:', error.response ? error.response.data : error.message);
      alert('Error adding friend.');
    }
  };

  // -------------------------------
  // 5) Remove a friend
  // -------------------------------
  const removeFriend = async (friendId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this friend? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/friends/${encodeURIComponent(friendId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Remove Friend Response:', response.data);
      alert(response.data.message);

      // Filter out from local state
      setFriends((prevFriends) => prevFriends.filter((f) => f.friend_id !== friendId));
    } catch (error) {
      console.error('Error removing friend:', error.response ? error.response.data : error.message);
      alert('Error removing friend.');
    }
  };

  // -------------------------------
  // 6) Start a conversation
  // -------------------------------
  const handleMessage = async (friendId) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/conversations`,
        { user1_id: user.sub, user2_id: friendId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Conversation Created:', response.data);
      navigate(`/chat/${response.data.conversation_id}`);
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
    <div className={styles.bg}>
    <div className={styles.friendsContainer}>
      {/* Add Friend Section */}
      <div className={styles.addFriendSection}>
        <h2>Add a Friend</h2>
        <div className={styles.addFriendForm}>
          <Typeahead
            id="friend-typeahead"
            labelKey="label"
            onChange={setSelectedUser}
            options={userOptions}
            selected={selectedUser}
            placeholder="Search for a friend by name"
            onInputChange={(text) => {
              searchUsers(text);
            }}
          />
          <button className={styles.addButton} onClick={addFriend}>
            Add Friend
          </button>
        </div>
      </div>

      {/* Friends List */}
      <div className={styles.friendsListSection}>
        <h2>Current Friends</h2>
        {friends.length === 0 ? (
          <p className={styles.noFriends}>You have no friends yet. Add some friends to get started!</p>
        ) : (
          <div className={styles.friendsGrid}>
            {friends.map((friend) => (
              <div key={friend.friend_id} className={styles.friendCard}>
                <Link to={`/profile/${friend.friend_id}`}>
                  <img src={friend.profile_picture} alt={friend.name} className={styles.friendAvatar}/>
                </Link>
                <div className={styles.friendInfo}>
                  <h3>{friend.name}</h3>
                  <p>
                    <strong>Friended At:</strong> {new Date(friend.friended_at).toLocaleString()}
                  </p>
                </div>
                <div className={styles.friendActions}>
                  <button className={styles.messageButton} onClick={() => handleMessage(friend.friend_id)}>
                    Message
                  </button>
                  <button className={styles.removeButton} onClick={() => removeFriend(friend.friend_id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Friends;
