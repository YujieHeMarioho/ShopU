import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { CardComponent } from './Card';
import styles from './CardGrid.module.css';

export const CardGrid = ({ listings = [], onCardClick }) => {
  return (
    <Container>
      <Row className={styles.cardGrid}>
        {listings.length === 0 ? (
          <Col xs={12}>
            <p>No listings available.</p>
          </Col>
        ) : (
          listings.map((listing, index) => (
            <Col key={index} xs={12} sm={6} md={4} lg={3} className={styles.cardWrapper}>
              <CardComponent
                image={listing.image}
                title={listing.title}
                description={listing.description}
                price={listing.price}
                onCardClick={() => openListingDetails(listing)}
                onFavoriteClick={() => saveToFavorites(listing)}
              />
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};
// Example functions (define these in your component or context)
const openListingDetails = (listing) => {
  // Logic to open a modal or navigate to a details page
};

const saveToFavorites = (listing) => {
  // Logic to save the item to favorites
};
