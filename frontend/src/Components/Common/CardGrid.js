import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { CardComponent } from './Card';
import { SocialCard } from '../Common';
import styles from './CardGrid.module.css';

export const CardGrid = ({ listings = [], variant = 'marketplace', openListingDetails, onUnfavorite, className }) => {
  return (
    <div className={`${styles.cardGrid} ${className}`}>
      <Container style={{ margin: 0 }}>
        <Row>
          {listings.length === 0 ? (
            <Col xs={12} className={styles.noListings}>
              <p>No listings available.</p>
            </Col>
          ) : (
            listings.map((listing, index) => (
              <Col
                key={index}
                xs={12}
                sm={6}
                md={variant === 'marketplace' ? 4 : 6}
                lg={variant === 'marketplace' ? 3 : 4}
                className={styles.listingCol}
              >
                {variant === 'marketplace' ? (
                  <CardComponent
                    image={listing.image}
                    title={listing.title}
                    description={listing.description}
                    price={listing.price}
                    listingId={listing.id}
                    onUnfavorite={onUnfavorite}
                  />
                ) : (
                  <SocialCard
                    key={listing.id}
                    post_id={listing.id}
                    image={listing.image}
                    video={listing.video}
                    title={listing.title}
                    description={listing.description}
                    profilePic={listing.profilePic}
                    author={listing.author}
                    initialLikes={listing.likes}
                    initialShares={listing.shares}
                    isLiked={listing.isLiked}
                    isShared={listing.isShared}
                    tags={listing.tags}
                  />
                )}
              </Col>
            ))
          )}
        </Row>
      </Container>
    </div>
  );
};
