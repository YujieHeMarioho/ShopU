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
              communityId={community.communityId}
            />

          </Col>
        ))}
      </Row>
    </Container>
  );
};
