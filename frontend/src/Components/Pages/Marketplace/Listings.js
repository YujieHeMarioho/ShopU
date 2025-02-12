import React, { useState } from 'react';
import { Modal, Button, Dropdown, DropdownButton, DropdownItem, Carousel } from 'react-bootstrap';
import './Listings.css'; 

import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ListingModal({ show, onHide, listing }) {
 const [dropDownTitle, setDropDownTitle] = useState('Select an Option')

  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  if (!listing) return null; // If no listing data, render nothing

  const handleDropDownClick = (option) => {
    setDropDownTitle(option);
  };


  // NEW: Function to handle messaging the seller using listing.user_id
  const handleMessageSeller = async () => {
    // Log the keys and full listing object for debugging
    console.log("Listing object keys:", Object.keys(listing));
    console.log("Listing object:", listing);
  
    // Use user_id or seller_id from the listing (whichever exists)
    const sellerId = listing.user_id || listing.seller_id;
    if (!sellerId) {
      alert('Seller information is not available.');
      return;
    }
  
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/conversations`,
        { 
          user1_id: user.sub, 
          user2_id: sellerId 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat/${response.data.conversation_id}`);
    } catch (error) {
      console.error(
        'Error starting conversation with seller:',
        error.response ? error.response.data : error.message
      );
      alert('Unable to start conversation with seller. Please try again.');
    }
  };
  

  return (
    <Modal show={show} onHide={onHide} dialogClassName='modal' centered>
      <Modal.Header closeButton>
          <Modal.Title className='card-title'>{listing.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className='modal-body'>
          <div className='carousel-container'>
              {listing.image.length > 1 ? (
              <Carousel interval={null} slide={false}>
                {listing.image.map((img, index) => (
                  <Carousel.Item key={index}>
                    <img
                      src={img}
                      alt={`Slide ${index}`}
                      className='img'
                    />
                  </Carousel.Item>
                ))}
              </Carousel>
            ) : (
              <img
                src={listing.image[0]}
                alt={listing.title}
                className='img'
              />
            )}
          </div>
          <div className='content'>
            <h5 className='card-price'>${listing.price}</h5>
            <div className='product-options'>
                <label htmlFor='product-options-dropdown' className='card-text'> Product Options </label>
                <Dropdown>
                  <Dropdown.Toggle id='product-options-dropdown' variant='outline-light' className='dropdown-text'> {dropDownTitle} </Dropdown.Toggle>
                  <Dropdown.Menu>
                      <Dropdown.Item as='button' onClick={()=> handleDropDownClick('Drop Off Location')}>Drop Off Location</Dropdown.Item>
                      <Dropdown.Item as='button' onClick={()=> handleDropDownClick('Pickup From Seller')}>Pickup From Seller</Dropdown.Item>
                      <Dropdown.Item as='button' onClick={()=> handleDropDownClick('Shipped')}>Shipped</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
            </div>
            <Button variant='dark' className='mb-2'> Offer Seller! </Button>
            <Button variant='dark' onClick={handleMessageSeller}> Message Seller! </Button>
            <p className='card-text'>{listing.description}</p>
          </div>
      </Modal.Body>
      <Modal.Footer>
          <h5 class='card-text'> add future similar listings here </h5>
      </Modal.Footer>
    </Modal>
  );
}

export default ListingModal;
