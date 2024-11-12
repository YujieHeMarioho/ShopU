import React from 'react';
import { CardComponent } from './Card';
import { Container, Row, Col } from 'react-bootstrap';

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
            />
          </Col>
        ))}
      </Row>
    </Container>
  );
};
