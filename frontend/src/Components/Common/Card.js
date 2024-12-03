import React, { act, useState, useEffect } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import styles from './Card.module.css';
import { useAuth0 } from '@auth0/auth0-react';


export const CardComponent = ({ image, title, description, price, onListingClick, listingId }) => {
  const { user } = useAuth0();
  const [isFavorited, setIsFavorited] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

    // Fetch the current favorite status when the component loads
    useEffect(() => {
      const fetchFavoriteStatus = async () => {
        //if (user) {
          try {
            // for now hardcoding userid to 1 should be switched to user.sub once auth is fully implemented
            const tempUserId = 1;
            const response = await fetchFavoriteStatusAPI(tempUserId, listingId);
            setIsFavorited(response.isFavorited);
          } catch (error) {
            console.error('Error fetching favorite status:', error);
          }
        //}
      };
  
      fetchFavoriteStatus();
    }, [user, listingId]);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation(); // Prevents triggering the onCardClick if you have it

    try {
      const action = isFavorited ? 'remove' : 'add';
      // hard coding user id to be 1 until user.sub is working from authentication
      const tempUserId = 1;
      const success = await favoriteAPICall(tempUserId, listingId, action);


      if (success) {
        setIsFavorited(!isFavorited);
        setAlertMessage(isFavorited ? "Item was removed from favorites list" : "Item was added to favorites list");

        // Clear alert after a few seconds
        setTimeout(() => setAlertMessage(null), 3000);

      }
    } catch (error) {
      console.error('Error:', error);
      setAlertMessage('Failed to update favorite. Please try again later.')
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

      <Card className={styles.card} onClick={onListingClick}>
        <div className={styles.imageContainer}>
          <Card.Img variant="top" src={image} alt={title} className={styles.cardImage} />
          <Button
            variant="light"
            className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : ''}`}
            onClick={handleFavoriteClick}
          >
            {isFavorited ? '💖' : '🤍'}
          </Button>
        </div>
        <Card.Body className={styles.cardBody}>
          <Card.Title className={styles.cardTitle}>{title}</Card.Title>
          <Card.Text className={styles.cardDescription}>{description}</Card.Text>
          <div className={styles.cardFooter}>
            <span className={styles.cardPrice}>${price}</span>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

const favoriteAPICall = async (userId, listingId, action) => {
  try {    
    userId = 1;
    const URL = `http://localhost:8080/api/favorite/${listingId}`;
    const method = action === 'add' ? 'POST' : 'DELETE';
    console.log('id', userId);
    const response = await fetch(URL, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId
      }),
    });

    if (response.ok) {
      return true;
    }
    else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Something went wrong');
    }
  }
  catch (error) {
    throw error;
  }
};

const fetchFavoriteStatusAPI = async (userId, listingId) => {
  try {
    const URL = `http://localhost:8080/api/favorite/status/${listingId}?userId=${userId}`;
    const response = await fetch(URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { isFavorited: data.isFavorited }; // Assuming the API response has `isFavorited` field
    } else {
      throw new Error('Failed to fetch favorite status');
    }
  } catch (error) {
    console.error('Error fetching favorite status:', error);
    throw error;
  }
};