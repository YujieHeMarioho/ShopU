import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function ListingModal({ show, onHide, listing }) {
  if (!listing) return null; // If no listing data, render nothing

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{listing.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <img src={listing.image} alt={listing.title} className="img-fluid mb-3" />
        <p>{listing.description}</p>
        <h5>Price: ${listing.price}</h5>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ListingModal;