import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { CommunityCardComponent } from './CommunityCard';

export const CommunityCardGrid = ({ communities }) => {
  return (
    <Container>
      <Row>
        {communities.map((community, index) => (
          <Col key={index} xs={12} sm={6} md={4} lg={3}>
            <CommunityCardComponent
              image={community.image}
              title={community.title}
              description={community.description}
              onCardClick={() => openCommunityDetails(community)}
              onFavoriteClick={() => saveToJoined(community)}
            />

          </Col>
        ))}
      </Row>
    </Container>
  );
};

// Example functions (define these in your component or context)
const openCommunityDetails = (listing) => {
  // Logic to open a modal or navigate to a details page
};

const saveToJoined = (listing) => {
  // Logic to save the item to favorites
};
