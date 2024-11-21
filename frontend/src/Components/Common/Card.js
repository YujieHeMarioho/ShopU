import React, { act, useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import styles from './Card.module.css';

export const CardComponent = ({ image, title, description, price, onClick, listingId}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation(); // Prevents triggering the onCardClick if you have it

    try{
      const action = isFavorited ? 'remove' : 'add';
      const success = await favoriteAPICall(listingId, action);
      console.error('In the try');
   
      if(success){
        setIsFavorited(!isFavorited);
        setAlertMessage(isFavorited ? "Item was removed from favorites list" : "Item was added to favorites list");

        // Clear alert after a few seconds
        setTimeout(() => setAlertMessage(null), 3000);

      }
    } catch(error){
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
      
      <Card className={styles.card}>
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

const favoriteAPICall = async (listingId, action) => {
  try {
    listingId = 1;
    const URL = `http://localhost:8080/api/favorite/${listingId}`;
    const method = action === 'add' ? 'POST' : 'DELETE';
    const response = await fetch(URL, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok){
      return true; 
    } 
    else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Something went wrong');
    }
  }
  catch(error) {
    throw error;
  }
};