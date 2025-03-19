import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { CardComponent } from './Card';
import {SocialCard} from '../Common';

export const CardGrid = ({ listings = [], variant = 'marketplace', openListingDetails, onUnfavorite, className }) => {
  return (
    <div className={className}>
    <Container style={{margin: 0}}>
      <Row>
        {listings.length === 0 ? (
          <Col xs={12}>
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
            >
              {variant === 'marketplace' ? (
                // Marketplace Card
                <CardComponent
                  image={listing.image}
                  title={listing.title}
                  description={listing.description}
                  price={listing.price}
                  listingId={listing.id}
                  onUnfavorite={onUnfavorite}
                  onListingClick={() => openListingDetails(listing)}
                  onFavoriteClick={() => saveToFavorites(listing)}
                />
              ) : (
                // Social Feed Card
                <SocialCard
                  key={listing.id} // Ensure unique key for each SocialCard
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

// Example functions (define these in your component or context)
const openListingDetails = (listing) => {
  // Logic to open a modal or navigate to a details page
};

const saveToFavorites = (listing) => {
  // Logic to save the item to favorites
};
