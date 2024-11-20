import React from 'react';
import { Modal, Button, Dropdown, DropdownButton, DropdownItem } from 'react-bootstrap';
import './Listings.css'; // Import the CSS file

function ListingModal({ show, onHide, listing }) {
  if (!listing) return null; // If no listing data, render nothing

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
    <Modal.Header closeButton>
      <Modal.Title className="modal-title">{listing.title}</Modal.Title>
    </Modal.Header>
    <Modal.Body className="modal-body"> {/* Image on the left */} <img src={listing.image} alt={listing.title} className="img-fluid mb-3" /> {/* Content on the right */} <div className="content">
        <h5 className="card-price">Price: ${listing.price}</h5>
        <div className="product-options">
          <label htmlFor="product-options-dropdown" className="card-text"> Product Options </label>
          <DropdownButton id="product-options-dropdown" title='Pickup From Seller' className="options-dropdown">
            <Dropdown.Item> Drop Off Location </Dropdown.Item>
            <Dropdown.Item> Shipped </Dropdown.Item>
          </DropdownButton>
        </div>
        <Button variant="secondary" className="mb-2"> Offer Seller! </Button>
        <Button variant="secondary"> Message Seller! </Button>
        <p className="card-text">{listing.description}</p>
      </div>
    </Modal.Body>
    <Modal.Footer>
      <h5 class='card-text'> add future similar listings here </h5>
    </Modal.Footer>
  </Modal>
  );
}

export default ListingModal;
