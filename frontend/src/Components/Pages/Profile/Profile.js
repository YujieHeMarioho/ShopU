import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaEnvelope, FaUser, FaEdit } from 'react-icons/fa';
import './Profile.module.css'; // Optional: Custom CSS

const Profile = () => {
  const { user } = useAuth0();
  const { name, picture, email, nickname, updated_at, created_at } = user;

  useEffect(() => {
    const saveUserToBackend = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            name, // Full name
            picture,
            nickname,
            created_at,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to save user to backend');
        }
        console.log('User saved successfully:', data);
      } catch (error) {
        console.error('Error saving user:', error);
      }
    };

    // Call saveUserToBackend when user information is available
    if (user) {
      saveUserToBackend();
    }
  }, [user, email, name, picture, nickname, created_at]);

  return (
    <Container className="my-5">
      <Card className="shadow-sm profile-card mb-4">
        <Card.Header className="profile-header">
          <h3 className="mb-0">User Profile</h3>
        </Card.Header>
        <Card.Body>
          <Row className="align-items-center">
            {/* Profile Picture */}
            <Col md={3} className="text-center mb-4 mb-md-0">
              <img
                src={picture}
                alt="Profile"
                className="rounded-circle img-fluid profile-picture"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
            </Col>

            {/* User Information */}
            <Col md={9}>
              <h4 className="mb-3">
                <FaUser className="me-2 text-primary" />
                {name} {/* Display full name */}
              </h4>
              <p className="mb-2">
                <FaEnvelope className="me-2 text-secondary" />
                <strong>Email:</strong> {email}
              </p>
              <p className="mb-2">
                <strong>Username:</strong> {nickname}
              </p>
              <p className="mb-2">
                <strong>Last Updated:</strong> {new Date(updated_at).toLocaleString()}
              </p>
              <Button variant="outline-primary" className="mt-3">
                <FaEdit className="me-2" />
                Edit Profile
              </Button>
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer className="text-muted text-end">
          Member since: {new Date(created_at).toLocaleDateString()}
        </Card.Footer>
      </Card>

      {/* JSON Section */}
      <Card className="shadow-sm">
        <Card.Header className="bg-secondary text-white">
          <h4 className="mb-0">User Information (JSON)</h4>
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
    </Container>
  );
};

export default Profile;
