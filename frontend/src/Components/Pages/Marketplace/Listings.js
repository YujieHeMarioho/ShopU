import React, { useState, useEffect } from 'react';
import { Modal, Button, Dropdown, Carousel, Form } from 'react-bootstrap';
import { CardComponent } from '../../Common';
import styles from './Listings.module.css';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaMapPin } from 'react-icons/fa';
import axios from 'axios';

function ListingModal({ show, onHide, listing }) {
   const [dropDownTitle, setDropDownTitle] = useState('Select an Option');
   const { getAccessTokenSilently, user, isAuthenticated } = useAuth0();
   const navigate = useNavigate();
   const [isEditing, setIsEditing] = useState(false);
   const [editTitle, setEditTitle] = useState(listing?.title || '');
   const [editPrice, setEditPrice] = useState(listing?.price || '');
   const [editDescription, setEditDescription] = useState(listing?.description || '');
   const [showConfirm, setShowConfirm] = useState(false); // Confirmation Modal
   const [categoryListings, setCategoryListings] = useState([]);

   const isOwner = isAuthenticated && listing && listing.user_id === user?.sub;

   useEffect(() => {
      if (isEditing) {
         setEditTitle(listing.title);
         setEditPrice(listing.price);
         setEditDescription(listing.description);
      }
   }, [isEditing, listing]);

   useEffect(() => {
      if (!listing) return;
      sameCategoryListings();
   }, [listing]);


   const handleDropDownClick = (option) => {
      setDropDownTitle(option);
   };

   const handleEditClick = () => {
      setIsEditing(true); // Enable edit mode
   };

   const handleCardClick = (listing) => {
      navigate(`/marketplace?listingId=${listing.id}`);
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
         setCategoryListings([]);
      }
   };

   const confirmExit = () => {
      setShowConfirm(false);
      handleCancelClick(); // Discard changes
      onHide(); // Close modal
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

   const sameCategoryListings = async () => {
      console.log(listing.id);
      console.log(listing.category);

      try {
         const token = await getAccessTokenSilently();

         const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/${listing.id}/category/${listing.category}`, {
            headers: {
               'Authorization': `Bearer ${token}`,
            },
         });

         const rawData = await response.json();

         // Map the data to match the desired format, now including user_id
         const formattedData = rawData.map(item => ({
            id: item.listing_id,
            user_id: item.user_id,
            title: item.title,
            description: item.description,
            category: item.category,
            type: item.item_type,
            rating: item.star_rating,
            price: item.price,
            image: item.file_keys,
         }));

         setCategoryListings(formattedData);
      }
      catch (error) {
         console.error('Error fetching similar listings:', error);
      }
   };


   return (
      <div>
         {/* Main Listing Modal */}
         <Modal show={show} onHide={handleCloseModal} dialogClassName='modal' centered className={styles.modal}>
            {!listing ? (
               // Fallback UI while loading or if listing is missing
               <Modal.Body className={styles.modalBody}>
                  <p>Loading listing details...</p>
               </Modal.Body>
            ) : (
               <>
                  <Modal.Header closeButton className={styles.modalHeader}>
                     <Modal.Title className={styles.cardTitle}>
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
                     <FaMapPin size={20} color="red" className={styles.locationIcon} /> {/* Location icon with size and color */}
                     <span className={styles.location}>
                        {listing.location}
                     </span>
                  </Modal.Header>
                  <Modal.Body className={styles.modalBody}>
                     <div className={styles.carouselContainerImages}>
                        {listing.image.length > 1 ? (
                           <Carousel interval={null} slide={false}>
                              {listing.image.map((img, index) => (
                                 <Carousel.Item key={index}>
                                    <img src={img} alt={`Slide ${index}`} className={styles.img} />
                                 </Carousel.Item>
                              ))}
                           </Carousel>
                        ) : (
                           <img src={listing.image[0]} alt={listing.title} className={styles.img} />
                        )}
                     </div>
                     <div className={styles.content}>
                        <div className={styles.priceAndButtons}>
                           <div className={styles.contentHeader}>
                           <h5 className={styles.cardPrice}>
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

                           {!isOwner && (
                              <div className={styles.AuthorAndRating}>
                                 <span className={styles.author}>{listing.author}</span>
                                 <Link to={`/profile/${listing.user_id}`}>
                                    <img src={listing.profile} alt={'Profile'} className={styles.profilePic} />
                                 </Link>
                              </div>
                           )}
                           </div>

                           {isOwner && (
                              <div className={styles.editButtons}>
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
                        <div className={styles.productOptions}>
                           <label htmlFor='product-options-dropdown' className={styles.cardText}>Product Options</label>
                           <Dropdown>
                              <Dropdown.Toggle id='product-options-dropdown' variant='outline-light' className={styles.dropdownText}>
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
                        <Button variant='dark' onClick={handleMessageSeller}>Message Seller!</Button>
                        <p className={styles.cardText}>
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
                  {/* Updated Footer with Up to 5 Cards in a Row */}
                  <Modal.Footer className={styles.modalFooter}>
                     <div className={styles.listingCardGrid}>
                        {categoryListings.slice(0, 5).map((listing) => (
                           <CardComponent
                              className={styles.listingCard}
                              key={listing.id}
                              image={listing.image}
                              title={listing.title}
                              description={listing.description}
                              price={listing.price}
                              onListingClick={() => handleCardClick(listing)}
                              listingId={listing.id}
                           />
                        ))}
                     </div>
                  </Modal.Footer>
               </>
            )}
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
      </div>
   );
}

export default ListingModal;
