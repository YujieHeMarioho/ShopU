import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, InputGroup, Form, Tab, Tabs } from 'react-bootstrap';
import { FaEnvelope, FaUser, FaEdit } from 'react-icons/fa';
import './Profile.module.css'; // Optional: Custom CSS
import UserPreferences from './UserPreferences';
import styles from './Profile.module.css';
import { SocialCard } from '../../Common';
import { CardGrid } from '../../Common';
import leaveCommunity from '../Community/Community';


const Profile = () => {
  const { user, getAccessTokenSilently } = useAuth0();  
  const { name, picture, email, updated_at, created_at } = user;

    const [formData, setFormData] = useState({
      name: name || '',
      email: email || '',
      picture: picture || ''});
      
  
    const [message, setMessage] = useState('');
    const [key, setKey] = useState('posts'); // Default active tab
    const [userPosts, setUserPosts] = useState([]); // Placeholder for posts
    const [userListings, setUserListings] = useState([]); // Placeholder for listings
    const [userStatistics, setUserStatistics] = useState({}); // Placeholder for statistics
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isGridLayout, setIsGridLayout] = useState(true); // State to toggle layout
    const [selectedCard, setSelectedCard] = useState(null);
    const [listings, setListings] = useState([]);
    const [createdCommunities, setCreatedCommunities] = useState([]);

     const handleCardClick = (post) => {
      console.log("Card clicked:", post);
      setSelectedCard(post);
    };

    useEffect(() => {
      // Fetch user posts, listings, and statistics here
      fetchUserPosts();
      fetchUserListings();
      fetchUserStatistics();
      fetchUserCommunities();
    }, []);

    const fetchUserPosts = async () => {
      try {
          const token = await getAccessTokenSilently();
  
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/user`, {
              headers: {
                  'Authorization': `Bearer ${token}`,
              },
          });
  
          if (!response.ok) throw new Error(`Failed to fetch user posts: ${response.statusText}`);
  
          const rawUserPosts = await response.json();
          setUserPosts(rawUserPosts);
          console.log('User Posts:', rawUserPosts);
      } catch (error) {
          console.error('Error fetching user posts:', error);
          setError('Failed to load user posts. Please try again later.');
      } finally {
          setLoading(false);
      }
  };
  
    const fetchUserListings = async () => {
      // Fetch listings logic (replace with your actual API)
      try{
        const token = await getAccessTokenSilently();
  
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const rawData = await response.json();
    
        // Map the data to match the desired format
        const formattedData = rawData.map(item => ({
          id: item.listing_id,
          title: item.title,
          description: item.description,
          category: item.category,
          type: item.item_type,
          rating: item.star_rating,
          price: item.price,
          image: item.file_keys,
        }));
    
        setUserListings(formattedData);
      } catch (error) {
        console.error('Error fetching listings:', error);
      }
    };

    const fetchUserCommunities = async()=>{
      try{
        const token = await getAccessTokenSilently();
    
        //get created communities
        const createdCommunityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities/created`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });
        setCreatedCommunities(createdCommunityResponse.data);
      } catch (error) {
        console.error('Error fetching communities:', error);
      }
    }

    const fetchUserStatistics = async () => {
      try {
        const token = await getAccessTokenSilently();
        
        // Fetch post count
        const postResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/user/count`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
    
        if (!postResponse.ok) {
          throw new Error('Failed to fetch post count');
        }
    
        const postCount = await postResponse.json();
    
        // Fetch listing count
        const listingResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/user/count`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
    
        if (!listingResponse.ok) {
          throw new Error('Failed to fetch listing count');
        }
    
        const listingCount = await listingResponse.json();
    
        // Fetch friends count
        const friendsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/friends/count`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
    
        if (!friendsResponse.ok) {
          throw new Error('Failed to fetch friends count');
        }
    
        const friendsCount = await friendsResponse.json();
    
        // Combine all statistics
        setUserStatistics({
          posts: postCount.count,
          listings: listingCount.count,
          friends: friendsCount.count,
        });
      } catch (error) {
        console.error('Error fetching user statistics:', error);
        setError('Failed to load user statistics. Please try again later.');
      }
    };
    
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    };
  
    // Save changes to the backend
    const handleSaveChanges = async () => {
      try {
        const token = await getAccessTokenSilently();
        
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            picture: formData.picture
          }),
        });
  
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to save changes');
        }
        setMessage('Profile updated successfully!');
      } catch (error) {
        console.error('Error saving user:', error);
        setMessage('Error saving profile: ' + error.message);
      }
    };

    return (
      <Container className="my-5">
        <Card className="shadow-sm profile-card mb-4">
          <Card.Header className="profile-header">
            <h3 className="mb-0">Your Profile</h3>
          </Card.Header>
          <Card.Body>
            <Row className="align-items-center">
              {/* Profile Picture */}
              <Col md={3} className="text-center mb-4 mb-md-0">
                <img
                  src={formData.picture}
                  alt="Profile"
                  className="rounded-circle img-fluid profile-picture"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
              </Col>
  
              <Col md={9}>
                {/* Name Input */}
                <InputGroup className="mb-3">
                  <InputGroup.Text id="name">Name</InputGroup.Text>
                  <Form.Control
                    placeholder="Name"
                    aria-label="Name"
                    aria-describedby="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </InputGroup>
  
                {/* Email Input */}
                <InputGroup className="mb-3">
                  <InputGroup.Text id="email">Email</InputGroup.Text>
                  <Form.Control
                    placeholder="Email"
                    aria-label="Email"
                    aria-describedby="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </InputGroup>
  
                {/* Picture URL Input */}
                <InputGroup className="mb-3">
                  <InputGroup.Text id="picture">Picture URL</InputGroup.Text>
                  <Form.Control
                    placeholder="Picture"
                    aria-label="Picture"
                    aria-describedby="Picture"
                    name="picture"
                    value={formData.picture}
                    onChange={handleInputChange}
                  />
                </InputGroup>
  
                {/* Save Changes Button */}
                <Button variant="outline-primary" className="mt-3" onClick={handleSaveChanges}>
                  <FaEdit className="me-2" />
                  Save Changes
                </Button>
  
                {/* Feedback Message */}
                {message && (
                  <p className={`mt-3 ${message.includes('Error') ? 'text-danger' : 'text-success'}`}>
                    {message}
                  </p>
                )}
              </Col>
            </Row>
          </Card.Body>
          <Card.Footer className="text-muted text-end">
            Member since: {new Date(created_at).toLocaleDateString()}
          </Card.Footer>
        </Card>

        {/* Tabs Section */}
        <Tabs activeKey={key} onSelect={(k) => setKey(k)} id="profile-tabs" className="mb-3">
        <Tab eventKey="posts" title="Posts">
            <div className={`${styles.feedContainer} ${isGridLayout ? styles.gridView : styles.scrollView}`}>
              {userPosts.length === 0 ? (
                <p>No posts available.</p>
              ) : (
                userPosts.map((post) => (
                  <div key={post.post_id} className={styles.gridItem} onClick={() => handleCardClick(post)}>
                    <SocialCard
                      post_id={post.post_id}                // Directly passing post_id
                      image={post.image}                   // Passing image URL
                      title={post.title}                   // Passing title
                      description={post.content}           // Passing content as description
                      profilePic={post.profile_pic_url}    // Passing profile picture URL
                      author={post.author}                 // Passing author name
                      initialLikes={post.likes_count}      // Mapping likes_count to initialLikes
                      initialShares={post.shares}          // Mapping shares to initialShares
                      isLikedAlready={post.is_liked}       // Check if post already liked by user
                      tags={post.tags}                     // Passing tags
                    />
                  </div>
                ))
              )}
            </div>
          </Tab>

          <Tab eventKey="listings" title="Listings">
            <div className={styles.cardGridContainer}>
              <CardGrid 
                listings={userListings} // Pass the listings here
                className={styles.cardGrid} 
                openListingDetails={handleCardClick} // Pass the card click handler here
              />
            </div>
          </Tab>
          <Tab eventKey="communities" title="Communities">
          <p className='section-title'>Your Created Communities</p>
            <div className="your-community-grid">
            {createdCommunities.length === 0 ? (
                <p>You haven't created any communities.</p>
            ) : (
                createdCommunities.map((community) => (
                    <div key={community.community_id} className="your-community-card">
                        <img
                            src={community.imageUrl}
                            alt={community.community_id}
                            className="community-image"
                        />
                        <div className="community-info">
                            <h3>{community.name || `Community ${community.community_id}`}</h3>
                            <p>Created At: {new Date(community.created_at).toLocaleString()}</p>
                            {/*<p>Joined At: {new Date(community.joined_at).toLocaleString()}</p>*/}
                        </div>
                        <button className="leave-button" onClick={() => leaveCommunity(community.community_id)}>
                            Leave {/*FIXME: add delete community ability*/}
                        </button>
                    </div>
                ))
            )}
            </div>
          </Tab>
          <Tab eventKey="statistics" title="Statistics">
            <Card className="profile-tab-statistics mb-3">
              <Card.Body>
                <h5>User Statistics</h5>
                <ul>
                  <li>Posts: {userStatistics.posts}</li>
                  <li>Listings: {userStatistics.listings}</li>
                  <li>Followers: {userStatistics.friends}</li>
                </ul>
              </Card.Body>
            </Card>
          </Tab>
        <Tab eventKey="preferences" title="User Preferences">
          <UserPreferences />
        </Tab>
      </Tabs>

        
        {/* JSON Section */}
        {/*<Card className="shadow-sm">
          <Card.Header className="bg-secondary text-white">
            <h4 className="mb-0">User Information</h4>
          </Card.Header>
          <Card.Body className="bg-light">
            <pre
              style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '14px',
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(user, null, 2)}
            </pre>
          </Card.Body>
        </Card>
        */}
      </Container>
    );
  };

export default Profile;
