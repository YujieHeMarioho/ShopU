import React, { useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import styles from './Card.module.css';

export const CardComponent = ({ image, title, description, price }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Prevents triggering the onCardClick if you have it

    setIsFavorited(!isFavorited);
    setAlertMessage(isFavorited ? "Item was removed from favorites list" : "Item was added to favorites list");

    // Clear alert after a few seconds
    setTimeout(() => setAlertMessage(null), 3000);
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
