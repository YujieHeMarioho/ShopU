import React, { useState } from 'react';
import { Modal, Button, Dropdown, Carousel } from 'react-bootstrap';
import './Listings.css';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

function ListingModal({ show, onHide, listing }) {
   const [dropDownTitle, setDropDownTitle] = useState('Select an Option')
   const { getAccessTokenSilently, user, isAuthenticated } = useAuth0();
   const navigate = useNavigate();

   if (!listing) return null; // If no listing data, render nothing

   const isOwner = isAuthenticated && listing.created_by === user?.sub; // Check if user is owner

   const handleDropDownClick = (option) => {
      setDropDownTitle(option);
   };

   const handleDeleteClick = async () => {
      try {
         const token = await getAccessTokenSilently();


         await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/${listing.id}/delete`, {
            method: "DELETE",
            headers: {
               'Authorization': `Bearer ${token}`,
            },
         });
         
         window.location.reload();
      }
      catch (error) {
         console.error("Error deleting listing:", error);
      }
   };

   const handleEditClick = async () => {

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
               <div className='price-and-buttons'>
                  <h5 className='card-price'>${listing.price}</h5>
                  {isOwner && (
                     <div className='edit-buttons'>
                        <Button variant='secondary' onClick={handleEditClick}>Edit</Button>
                        <Button variant='danger' onClick={handleDeleteClick}>Delete</Button>
                     </div>
                  )}
               </div>
               <div className='product-options'>
                  <label htmlFor='product-options-dropdown' className='card-text'> Product Options </label>
                  <Dropdown>
                     <Dropdown.Toggle id='product-options-dropdown' variant='outline-light' className='dropdown-text'> {dropDownTitle} </Dropdown.Toggle>
                     <Dropdown.Menu>
                        <Dropdown.Item as='button' onClick={() => handleDropDownClick('Drop Off Location')}>Drop Off Location</Dropdown.Item>
                        <Dropdown.Item as='button' onClick={() => handleDropDownClick('Pickup From Seller')}>Pickup From Seller</Dropdown.Item>
                        <Dropdown.Item as='button' onClick={() => handleDropDownClick('Shipped')}>Shipped</Dropdown.Item>
                     </Dropdown.Menu>
                  </Dropdown>
               </div>
               <Button variant='dark' className='mb-2'> Offer Seller! </Button>
               <Button variant='dark'> Message Seller! </Button>
               <p className='card-text'>{listing.description}</p>
            </div>
         </Modal.Body>
         <Modal.Footer>
            <h5 class='card-text'> add future similar listings here </h5>
         </Modal.Footer>
      </Modal>
   );
};

export default ListingModal;
