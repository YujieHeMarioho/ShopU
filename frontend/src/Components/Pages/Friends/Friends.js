import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
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
                  name: friendResponse.data.name, 
                  email: friendResponse.data.email, // Include email
                  profile_picture: friendResponse.data.picture 
                };
              } catch (error) {
                console.error(`Error fetching data for friend_id ${friend.friend_id}:`, error.response ? error.response.data : error.message);
                return { 
                  ...friend, 
                  name: 'Unknown User', 
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

  const searchUsers = async (query) => {
    if (query.length < 2) return; // Don't search for very short queries
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/search`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { query }
        }
      );
      setUserOptions(response.data.map(user => ({
        id: user.id,
        label: `${user.name}`
      })));
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const addFriend = async () => {
    if (selectedUser.length === 0) {
      alert('Please select a user to add as a friend.');
      return;
    }
    
    const newFriend = selectedUser[0];

    if (friends.some((friend) => friend.friend_id === newFriend.id)) {
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

      // Fetch the new friend's details and add to the state
      const friendResponse = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/user/${encodeURIComponent(newFriend.id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(`New Friend ${newFriend.label} Details:`, friendResponse.data);

      setFriends((prevFriends) => [
        ...prevFriends,
        { 
          ...friendResponse.data, 
          friend_id: newFriend.id, 
          username: friendResponse.data.username || newFriend.label,
          friended_at: new Date().toISOString()
        },
      ]);

      // Clear the selection after adding
      setSelectedUser([]);

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
          <button className={styles.addButton} onClick={addFriend}>Add Friend</button>
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
                <img
                  src={friend.profile_picture} 
                  alt={friend.name} 
                  className={styles.friendAvatar}
                />
                <div className={styles.friendInfo}>
                <h3>{friend.name}</h3>
                <p><strong>Friended At:</strong> {new Date(friend.friended_at).toLocaleString()}</p>
                </div>
                <div className={styles.friendActions}>
                <button className={styles.messageButton} onClick={() => handleMessage(friend.friend_id)}>Message</button>
                <button className={styles.removeButton} onClick={() => removeFriend(friend.friend_id)}>Remove</button>
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
