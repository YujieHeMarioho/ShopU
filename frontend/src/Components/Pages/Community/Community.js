import { Banner, CommunityCardGrid} from '../../Common';
import React, { useState, useLayoutEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './Community.css';

const Communities = () => {

// Fetch user info and their friends

  /*const { user, isLoading: authLoading } = useAuth0();*/
  const [userInfo, setUserInfo] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [newCommunityId, setNewCommunityId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const user_id = 32
  const user_email = "u1275258@utah.edu"

  useLayoutEffect(() => {
    if (isLoading) {
        const fetchUserInfo = async () => {
            try {
                // Get the current user's ID from the backend
                //const userResponse = await axios.get(`http://localhost:8080/api/user-id/${user_email}`);
                //setUserInfo(userResponse.data);

                // Fetch communities for the current user
                const communityResponse = await axios.get(`http://localhost:8080/api/communities/${user_id}`);

                setCommunities(communityResponse.data);
            } catch (error) {
                console.error('Error fetching user info or communities:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserInfo();
    }
  }, [isLoading]);


  // Add a community
  const addCommunity = async () => {
    if (!newCommunityId) {
      alert('Please enter a valid Community ID.');
      return;
    }
    // Prevent adding the same community twice in the frontend
    if (communities.some(community => community.community_id === newCommunityId)) {
      alert('Community Already Joined.');
      setNewCommunityId(''); // Clear input field
      return;
    }
    try {
      const response = await axios.post('http://localhost:8080/api/communities', {
        user_id: user_id,
        community_id: newCommunityId,
      });
      alert("Community added successfully"); // Success message
      setNewCommunityId(''); // Clear input field

      // Fetch the updated communities list with details
      const communityResponse = await axios.get(`http://localhost:8080/api/communities/${user_id}`);
      setCommunities(communityResponse.data); // Update state with full details
    } catch (error) {
      console.error('Error adding community:', error);
      alert('Error adding community.');
    }
  };


  // Remove a community
  const leaveCommunity = async (communityId) => {
    try {
      const response = await axios.delete(`http://localhost:8080/api/communities/${user_id}/${communityId}`);
      alert(response.data.message);
  
      // Fetch the updated communities list with details
      const communityResponse = await axios.get(`http://localhost:8080/api/communities/${user_id}`);
      setCommunities(communityResponse.data); // Update state with full details
    } catch (error) {
      console.error('Error removing community:', error);
      alert('Error removing community.');
    }
  };

  // Sample Community data
  const communities_data = [
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Community 1',
      description: 'This is a description for community 1.',
    },
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Community 2',
      description: 'This is a description for community 2.',
    },
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Community 3',
      description: 'This is a description for community 3.',
    },
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Community 4',
      description: 'This is a description for community 4.',
    },
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Community 5',
      description: 'This is a description for community 5.',
    },
  ];

  /*if (isLoading) {
    return <div className="loading">Loading user information...</div>;
  }*/

  /*if (!userInfo) {
    return <div className="error">Error: Unable to load user information.</div>;
  }*/

  return (
    <div>
      <Banner
        title="Communities"
        description="Here are some communities you might like."
      />

      {/* Add Community Section */}
      <div className="add-community-section">
        <h2>Add a New Community</h2>
        <div className="add-community-form">
          <input
            type="text"
            placeholder="Enter Community ID"
            value={newCommunityId}
            onChange={(e) => setNewCommunityId(e.target.value)}
          />
          <button onClick={addCommunity}>Add Community</button>
        </div>
      </div>

      <div className="your-community-grid">
      <h2>Your Communities</h2>
      {communities.length === 0 ? (
          <p>You have no communities yet. Take a look at these suggested communities!</p>
      ) : (
          communities.map((community) => (
              <div key={community.community_id} className="your-community-card">
                  <img
                      src={'https://via.placeholder.com/100'}
                      alt={community.community_id}
                      className="community-image"
                  />
                  <div className="community-info">
                      <h3>{community.name || `Community ${community.community_id}`}</h3>
                      <p>Joined At: {new Date(community.joined_at).toLocaleString()}</p>
                  </div>
                  <button className="leave-button" onClick={() => leaveCommunity(community.community_id)}>
                      Leave
                  </button>
              </div>
          ))
      )}
      </div>
        {/* Render CardGrid with listings */}
        <CommunityCardGrid communities={communities_data} />
    </div>

    
  );
}

export default Communities;
