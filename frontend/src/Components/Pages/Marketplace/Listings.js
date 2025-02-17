import React, { useState, useEffect } from 'react';
import { Modal, Button, Dropdown, Carousel, Form } from 'react-bootstrap';
import './Listings.css';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

function ListingModal({ show, onHide, listing }) {
   const [dropDownTitle, setDropDownTitle] = useState('Select an Option');
   const { getAccessTokenSilently, user, isAuthenticated } = useAuth0();
   const navigate = useNavigate();

   // Edit Mode State
   const [isEditing, setIsEditing] = useState(false);
   const [editTitle, setEditTitle] = useState(listing?.title || '');
   const [editPrice, setEditPrice] = useState(listing?.price || '');
   const [editDescription, setEditDescription] = useState(listing?.description || '');
   const [showConfirm, setShowConfirm] = useState(false); // Confirmation Modal

   useEffect(() => {
      if (isEditing) {
         setEditTitle(listing.title);
         setEditPrice(listing.price);
         setEditDescription(listing.description);
      }
   }, [isEditing, listing]);

   if (!listing) return null;

   const isOwner = isAuthenticated && listing.created_by === user?.sub;

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
      } catch (error) {
         console.error("Error deleting listing:", error);
      }
   };

   const handleEditClick = () => {
      setIsEditing(true); // Enable edit mode
   };

   const handleSaveClick = async () => {
      try {
         const token = await getAccessTokenSilently();

         const updatedListing = {
            title: editTitle,
            price: editPrice,
            description: editDescription,
         };

         const json = JSON.stringify(updatedListing);
         await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/${listing.id}/edit`, {
            method: "PUT",
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: json,
         });

         setIsEditing(false); // Exit edit mode
         window.location.reload();
      } catch (error) {
         console.error("Error updating listing:", error);
      }
   };

   const handleCancelClick = () => {
      // Restore original values and exit edit mode
      setEditTitle(listing.title);
      setEditPrice(listing.price);
      setEditDescription(listing.description);
      setIsEditing(false);
   };

   const handleCloseModal = () => {
      if (isEditing) {
         setShowConfirm(true); // Show confirmation popup
      } else {
         onHide(); // Close modal normally if not editing
      }
   };

   const confirmExit = () => {
      setShowConfirm(false);
      handleCancelClick(); // Discard changes
      onHide(); // Close modal
   };

   return (
      <>
         {/* Main Listing Modal */}
         <Modal show={show} onHide={handleCloseModal} dialogClassName='modal' centered>
            <Modal.Header closeButton>
               <Modal.Title className='card-title'>
                  {isEditing ? (
                     <Form.Control
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                     />
                  ) : (
                     listing.title
                  )}
               </Modal.Title>
            </Modal.Header>
            <Modal.Body className='modal-body'>
               <div className='carousel-container'>
                  {listing.image.length > 1 ? (
                     <Carousel interval={null} slide={false}>
                        {listing.image.map((img, index) => (
                           <Carousel.Item key={index}>
                              <img src={img} alt={`Slide ${index}`} className='img' />
                           </Carousel.Item>
                        ))}
                     </Carousel>
                  ) : (
                     <img src={listing.image[0]} alt={listing.title} className='img' />
                  )}
               </div>
               <div className='content'>
                  <div className='price-and-buttons'>
                     <h5 className='card-price'>
                        {isEditing ? (
                           <Form.Control
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                           />
                        ) : (
                           `$${listing.price}`
                        )}
                     </h5>
                     {isOwner && (
                        <div className='edit-buttons'>
                           {isEditing ? (
                              <>
                                 <Button variant='success' onClick={handleSaveClick}>Save</Button>
                                 <Button variant='warning' onClick={handleCancelClick}>Cancel</Button>
                              </>
                           ) : (
                              <Button variant='secondary' onClick={handleEditClick}>Edit</Button>
                           )}
                           <Button variant='danger' onClick={handleDeleteClick}>Delete</Button>
                        </div>
                     )}
                  </div>
                  <div className='product-options'>
                     <label htmlFor='product-options-dropdown' className='card-text'>Product Options</label>
                     <Dropdown>
                        <Dropdown.Toggle id='product-options-dropdown' variant='outline-light' className='dropdown-text'>
                           {dropDownTitle}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                           <Dropdown.Item as='button' onClick={() => handleDropDownClick('Drop Off Location')}>Drop Off Location</Dropdown.Item>
                           <Dropdown.Item as='button' onClick={() => handleDropDownClick('Pickup From Seller')}>Pickup From Seller</Dropdown.Item>
                           <Dropdown.Item as='button' onClick={() => handleDropDownClick('Shipped')}>Shipped</Dropdown.Item>
                        </Dropdown.Menu>
                     </Dropdown>
                  </div>
                  <Button variant='dark' className='mb-2'>Offer Seller!</Button>
                  <Button variant='dark'>Message Seller!</Button>
                  <p className='card-text'>
                     {isEditing ? (
                        <Form.Control
                           as="textarea"
                           rows={3}
                           value={editDescription}
                           onChange={(e) => setEditDescription(e.target.value)}
                        />
                     ) : (
                        listing.description
                     )}
                  </p>
               </div>
            </Modal.Body>
            <Modal.Footer>
               <h5 className='card-text'>Add future similar listings here</h5>
            </Modal.Footer>
         </Modal>

         {/* Confirmation Popup */}
         <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
            <Modal.Header closeButton>
               <Modal.Title>Unsaved Changes</Modal.Title>
            </Modal.Header>
            <Modal.Body>
               <p>You have unsaved changes. Are you sure you want to exit?</p>
            </Modal.Body>
            <Modal.Footer>
               <Button variant="secondary" onClick={() => setShowConfirm(false)}>No, Stay</Button>
               <Button variant="danger" onClick={confirmExit}>Yes, Exit</Button>
            </Modal.Footer>
         </Modal>
      </>
   );
}

export default ListingModal;
