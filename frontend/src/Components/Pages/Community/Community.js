import { Banner, CommunityCardGrid} from '../../Common';
import React, { useState, useLayoutEffect, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import styles from './Community.module.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { use } from 'react';

const Communities = () => {

// Fetch user info and their friends

  /*const { user, isLoading: authLoading } = useAuth0();*/
  //const [userInfo, setUserInfo] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [otherCommunities, setOtherCommunities] = useState([]);
  const [createdCommunities, setCreatedCommunities] = useState([]);
  const [newCommunityId, setNewCommunityId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState('');
  const [communityImage, setCommunityImage] = useState(null);

  const { getAccessTokenSilently, user } = useAuth0();  

  useLayoutEffect(() => {    
    if (isLoading) {
        const fetchUserInfo = async () => {
            try {
              const token = await getAccessTokenSilently();
                // Get the current user's ID from the backend
                //const userResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user-id/${user_email}`);
                //setUserInfo(userResponse.data);

                // Fetch communities for the current user
                const communityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    }
                  }
                //other communities
                );
                const otherCommunityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities/other`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    }
                  }
                );
                //created communities
                const createdCommunityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities/created/${user.sub}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    }
                  }
                );

                setCommunities(communityResponse.data);
                setOtherCommunities(otherCommunityResponse.data);
                setCreatedCommunities(createdCommunityResponse.data);
                console.log('the raw returned data',communityResponse.data);

            } catch (error) {
                console.error('Error fetching user info or communities:', error);
            } finally {
                setIsLoading(false);
            }

        };

        fetchUserInfo();
    }
  }, [isLoading]);

  //Create a community
  const createCommunity = async () => {
    if (!newCommunityName)
    {
      alert('Please name your community.');
      return;
    }
    if (!newCommunityDescription)
    {
      alert('Please give your community a description.');
      return;
    }
    if (!communityImage){
      alert('Please give your community an image.');
      return;
    }
    //prevent duplicate names
    if (communities.some(community => community.name === newCommunityName)) {
      alert('Community Already Exists.');
      return;
    }

    try {
      const token = await getAccessTokenSilently();

      const imageForm = new FormData();
      imageForm.append('communityImage', communityImage);
      
      const returnedImageKey = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/communities/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: imageForm,
      });

      const imageData = await returnedImageKey.json(); 

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/communities/add`, {
        name: newCommunityName,
        description: newCommunityDescription,
        imageKey: imageData.fileKey
      }, 
      {    
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    );
      alert("Community created successfully"); // Success message
      setNewCommunityName(''); // Clear input field
      setNewCommunityDescription('');

      // Fetch the updated communities list with details
      const communityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      //other communities
      const otherCommunityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities/other`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      //created communities
      const createdCommunityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities/created/${user.sub}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      setOtherCommunities(otherCommunityResponse.data);
      setCommunities(communityResponse.data); // Update state with full details
      setCreatedCommunities(createdCommunityResponse.data);
    } catch (error) {
      console.error('Error creating community:', error);
      //alert(error)
      alert('Error creating community.');
    }
  }

  // join a community
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
      const token = await getAccessTokenSilently();
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/communities`, {
        community_id: newCommunityId
      }, 
      {    
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    );
      alert("Community added successfully"); // Success message
      setNewCommunityId(''); // Clear input field

      // Fetch the updated communities list with details
      const communityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      const otherCommunityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities/other`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      setOtherCommunities(otherCommunityResponse.data);
      setCommunities(communityResponse.data); // Update state with full details
    } catch (error) {
      console.error('Error adding community:', error);
      alert('Error adding community.');
    }
  };


  // Remove a community
  const leaveCommunity = async (communityId) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/communities/${communityId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      alert(response.data.message);
  
      // Fetch the updated communities list with details
      const communityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      const otherCommunityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities/other`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      setOtherCommunities(otherCommunityResponse.data);
      setCommunities(communityResponse.data); // Update state with full details
    } catch (error) {
      console.error('Error removing community:', error);
      alert('Error removing community.');
    }
  };

  // Delete a community permanently
  const deleteCommunity = async (communityId) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/communities/delete/${communityId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      alert(response.data.message);
  
      // Fetch the updated communities list with details
      const communityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      const otherCommunityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities/other`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      //created communities
      const createdCommunityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities/created/${user.sub}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      setOtherCommunities(otherCommunityResponse.data);
      setCommunities(communityResponse.data); // Update state with full details
      setCreatedCommunities(createdCommunityResponse.data);
    } catch (error) {
      console.error('Error removing community:', error);
      alert('Error deleting community.');
    }
  };

  // Handler when user clicks a community
  const handleCardClick = (comm_id, e) => {
    if (e.target.closest('button')) {
      return;
    }
    window.location.href=`/community/${comm_id}`;
  };


  // Map the data to match the desired format
  const formattedOtherCommunities = otherCommunities.map(comm => ({
    title: comm.name,
    description: comm.description,
    image: comm.imageUrl,
    communityId: comm.community_id
  }));
  const formattedCreatedCommunities = createdCommunities.map(comm => ({
    title: comm.name,
    description: comm.description,
    image: comm.imageUrl,
    communityId: comm.community_id
  }));

  /*if (isLoading) {
    return <div className="loading">Loading user information...</div>;
  }*/

  /*if (!userInfo) {
    return <div className="error">Error: Unable to load user information.</div>;
  }*/

    console.log(communities);
    console.log(otherCommunities);
    console.log(createdCommunities);

  return (
    <div className={styles.communityContainer}>
      <Banner
        title="Communities"
        description="Here are some communities in your orbit."
        showConnectButton={false}
        className={styles.banner}
      />

      {/* Add Community Section */}
      {/*<div className="add-community-section">
        <h2>Join a New Community</h2>
        <div className="add-community-form">
          <input
            type="text"
            placeholder="Enter Community ID"
            value={newCommunityId}
            onChange={(e) => setNewCommunityId(e.target.value)}
          />
          <button onClick={addCommunity}>Add Community</button>
        </div>
      </div>*/}

      <div className="your-community-grid">
      <h2>Your Communities</h2>
      {communities.length === 0 ? (
          <p>You have no communities yet. Take a look at these suggested communities!</p>
      ) : (
          communities.map((community) => (
              <div key={community.community_id} className={styles.yourCommunityCard} onClick={(e) => handleCardClick(community.community_id, e)}>
                  <img
                      src={community.imageUrl}
                      alt={community.community_id}
                      className={styles.communityImage}
                  />
                  <div className={styles.communityInfo}>
                      <h3>{community.name || `Community ${community.community_id}`}</h3>
                      <p>{community.description}</p>
                      {/* <p>Joined At: {new Date(community.joined_at).toLocaleString()}</p> */}
                  </div>
                  <button className={styles.leaveButton} onClick={() => leaveCommunity(community.community_id)}>
                      Leave
                  </button>
              </div>
          ))
      )}
      </div>
      <div className="community-browse">
        {/* Render CardGrid with listings */}
        <h2>Browse Communities</h2>
        <CommunityCardGrid communities={formattedOtherCommunities} openCommunityDetails={handleCardClick}/>
      </div>
      <div className={styles.createCommunitySection}>
        <h2>Create a New Community</h2>
        <div className={styles.createCommunityForm}>
          <input
            type="text"
            placeholder="Enter Community Name"
            value={newCommunityName}
            onChange={(e) => setNewCommunityName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter Community Description"
            value={newCommunityDescription}
            onChange={(e) => setNewCommunityDescription(e.target.value)}
            />
            <div className={styles.communityImageField}>
              <label for="communityImage">Add A Community Image</label>
              <input type='file' id="community-image" name="communityImage" accept="image/jpeg, image/png, image/jpg, image/gif" onChange={(e) => setCommunityImage(e.target.files[0])}/>
            </div>
          <button onClick={createCommunity}>Create Community</button>
        </div>
      </div>
      <div className="your-community-grid">
      <h2>Your Created Communities</h2>
      {createdCommunities.length === 0 ? (
          <p>You haven't created any communities.</p>
      ) : (
          createdCommunities.map((community) => (
              <div key={community.community_id} className={styles.yourCommunityCard} onClick={(e) => handleCardClick(community.community_id, e)}>
                  <img
                      src={community.imageUrl}
                      alt={community.community_id}
                      className={styles.communityImage}
                  />
                  <div className={styles.communityInfo}>
                      <h3>{community.name || `Community ${community.community_id}`}</h3>
                      <p>{community.description}</p>
                      {/*<p>Joined At: {new Date(community.joined_at).toLocaleString()}</p>*/}
                  </div>
                  <button className={styles.leaveButton} onClick={() => deleteCommunity(community.community_id)}>
                      Delete Permanently {/*FIXME: add delete community ability*/}
                  </button>
              </div>
          ))
      )}
      </div>
    </div>

    
  );
}

export default Communities;
