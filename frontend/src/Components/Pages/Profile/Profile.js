import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Container, Row, Col, Card, Button, InputGroup, Form } from 'react-bootstrap';
import { FaEnvelope, FaUser, FaEdit } from 'react-icons/fa';
import './Profile.module.css'; // Optional: Custom CSS

const Profile = () => {
  const { user, getAccessTokenSilently } = useAuth0();  
  const { name, picture, email, updated_at, created_at } = user;

    const [formData, setFormData] = useState({
      name: name || '',
      email: email || '',
      picture: picture || ''});
      
  
    const [message, setMessage] = useState('');
  
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
        
        const response = await fetch('http://localhost:8080/api/users', {
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
