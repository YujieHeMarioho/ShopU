import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { CardComponent } from './Card';

export const CardGrid = ({ listings }) => {
  return (
    <Container>
      <Row>
        {listings.map((listing, index) => (
          <Col key={index} xs={12} sm={6} md={4} lg={3}>
            <CardComponent
              image={listing.image}
              title={listing.title}
              description={listing.description}
              price={listing.price}
              onCardClick={() => openListingDetails(listing)}
              onFavoriteClick={() => saveToFavorites(listing)}
            />

          </Col>
        ))}
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
