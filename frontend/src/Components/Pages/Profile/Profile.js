import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Container, Row, Col, Card, Button, InputGroup, Form, Tab, Tabs } from 'react-bootstrap';
import { FaEnvelope, FaUser, FaEdit } from 'react-icons/fa';
import './Profile.module.css'; // Optional: Custom CSS
import UserPreferences from './UserPreferences';
import styles from './Profile.module.css';
import { SocialCard } from '../../Common';

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

     const handleCardClick = (post) => {
      console.log("Card clicked:", post);
      setSelectedCard(post);
    };

    useEffect(() => {
      // Fetch user posts, listings, and statistics here
      fetchUserPosts();
      fetchUserListings();
      fetchUserStatistics();
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
      setUserListings([
        { id: 1, title: 'Item 1', description: 'Description of item 1' },
        { id: 2, title: 'Item 2', description: 'Description of item 2' },
      ]);
    };

    const fetchUserStatistics = async () => {
      // Fetch statistics logic (replace with your actual API)
      setUserStatistics({ posts: 5, listings: 10, followers: 200 });
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
          <Row>
            {userListings.map((listing) => (
              <Col sm={4} key={listing.id}>
                <Card className="mb-3">
                  <Card.Body>
                    <Card.Title>{listing.title}</Card.Title>
                    <Card.Text>{listing.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Tab>
        <Tab eventKey="statistics" title="Statistics">
          <Card className="mb-3">
            <Card.Body>
              <h5>User Statistics</h5>
              <ul>
                <li>Posts: {userStatistics.posts}</li>
                <li>Listings: {userStatistics.listings}</li>
                <li>Followers: {userStatistics.followers}</li>
              </ul>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      <UserPreferences></UserPreferences>

        
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
