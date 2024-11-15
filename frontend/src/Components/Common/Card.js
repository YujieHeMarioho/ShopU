import React from 'react';
import { Card, Button } from 'react-bootstrap';

export const CardComponent = ({ image, title, description, price, onClick }) => {
  return (
    <Card className="mb-4" onClick={onClick}>
      <Card.Img variant="top" src={image} alt={title} />
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <Card.Text>{description}</Card.Text>
        <Card.Footer className="text-muted">
          <span>{`Price: $${price}`}</span>
        </Card.Footer>
        <Button variant="primary">Buy Now</Button>
      </Card.Body>
    </Card>
  );
};
