import React, { act, useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import styles from './CommunityCard.module.css';
import { useAuth0 } from '@auth0/auth0-react';

export const CommunityCardComponent = ({ image, title, description, communityId}) => {
  const { getAccessTokenSilently } = useAuth0();

  const [isJoined, setIsJoined] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const handleJoinClick = async (e) => {
    setAlertMessage("Adding Community...")
    e.stopPropagation(); // Prevents triggering the onCardClick if you have it

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('http://localhost:8080/api/communities', {
        method: "POST",
        body: JSON.stringify({ community_id: `${communityId}` }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
   
      if (response.ok){
        window.location.reload()
        return true; 
      } 
      else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }
    } catch(error){
      console.error('Error:', error);
      setAlertMessage('Error:' + error)
      setAlertMessage('Failed to update community. Please try again later.')
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  return (
    <div>
      {/* Display alert if there is a message */}
      {alertMessage && (
        <Alert variant="info" className={styles.alert}>
          {alertMessage}
        </Alert>
      )}
      
      <Card className={styles.card}>
        <div className={styles.imageContainer}>
          <Card.Img variant="top" src={image} alt={title} className={styles.cardImage} />
          
        </div>
        <Card.Body className={styles.cardBody}>
          <Card.Title className={styles.cardTitle}>{title}</Card.Title>
          <Card.Text className={styles.cardDescription}>{description}</Card.Text>
        </Card.Body>
        <Button
            variant="light"
            className={`${styles.joinButton} ${isJoined ? styles.joined : ''}`}
            onClick={handleJoinClick}
          >
            Join
            {/*isJoined ? '💖' : '🤍'*/}
          </Button>
      </Card>
    </div>
  );
};