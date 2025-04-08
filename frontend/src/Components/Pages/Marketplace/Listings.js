import React, { useState, useEffect } from 'react';
import { Button, Dropdown, Carousel, Form } from 'react-bootstrap';
import { CardComponent } from '../../Common';
import styles from './Listings.module.css';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, Link } from 'react-router-dom';
import { FaMapPin, FaFlag } from 'react-icons/fa';
import OfferModal from "./OfferModal";
import axios from 'axios';
import { format } from 'date-fns';
import ReportModal from '../../Common/ReportModal';

export const ListingModal = ({ show, onHide, listing }) => {
   const [dropDownTitle, setDropDownTitle] = useState('Select an Option');
   const { getAccessTokenSilently, user, isAuthenticated } = useAuth0();
   const navigate = useNavigate();
   const [isEditing, setIsEditing] = useState(false);
   const [editTitle, setEditTitle] = useState(listing?.title || '');
   const [editPrice, setEditPrice] = useState(listing?.price || '');
   const [editDescription, setEditDescription] = useState(listing?.description || '');
   const [showConfirm, setShowConfirm] = useState(false); // Confirmation Modal
   const [categoryListings, setCategoryListings] = useState([]);
   const [location, setLocation] = useState('');
   const [showOfferModal, setShowOfferModal] = useState(false);
   const [selectedServiceId, setSelectedServiceId] = useState(null);
   const [appointments, setAppointments] = useState([]);;
   const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
   const [appointmentMap, setAppointmentMap] = useState({});

   const isOwner = isAuthenticated && listing && listing.user_id === user?.sub;
   const isServiceListing = listing.type == 'service';

   const dropdownOptions = isServiceListing
      ? listing.services.map(service => ({
         label: `${service.service_name} - $${service.service_price}`,
         value: service.service_id
      }))
      : [];

      const [showReportModal, setShowReportModal] = useState(false);
      const [reportingItemId, setReportingItemId] = useState(null);

   useEffect(() => {
      if (isEditing) {
         setEditTitle(listing.title);
         setEditPrice(listing.price);
         setEditDescription(listing.description);
      }
   }, [isEditing, listing]);

   
   useEffect(() => {
      // Run this logic only when appointments change
      const tempAppointmentMap = appointments.reduce((map, appt) => {
          let cleanDate = appt.date.substring(0, 10);
          let time = appt.time.includes(":") ? appt.time : `${appt.time}:00`;
  
          const appointmentDateString = `${cleanDate}T${time}`;
          const appointmentDate = new Date(appointmentDateString);
  
          if (isNaN(appointmentDate.getTime())) {
              console.error("Invalid Date:", appointmentDateString);
              return map;
          }
  
          const formattedDate = format(appointmentDate, 'MM/dd/yyyy, hh:mm a');
  

          map[formattedDate] = appt.service_id;
          return map;
      }, {});
  
      setAppointmentMap(tempAppointmentMap);
  }, [appointments]);  

   useEffect(() => {
      if (selectedServiceId) {

         handleScheduleAppointment();
      }
   }, [selectedServiceId]); 

   useEffect(() => {
      if (!listing) return;
      sameCategoryListings();
   }, [listing]);

   useEffect(() => {
      if (show) {
         // Lock scrolling
         document.body.style.overflow = 'hidden';
      } else {
         // Restore scrolling when modal is closed
         document.body.style.overflow = 'auto';
      }

      // Cleanup when the component unmounts
      return () => {
         document.body.style.overflow = 'auto';
      };
   }, [show]);


   useEffect(() => {
      if (listing) {
         setLocation(listing.location || 'Location not available'); // Set location if available
      }
   }, [listing]);

   const handleCardClick = (listing) => {
      navigate(`/marketplace?listingId=${listing.id}`);
   };

   const handleDropDownClick = (option) => {;
      setDropDownTitle(option.label);
      setSelectedServiceId(option.value);
   };

   const handleOfferSeller = () => {
      setShowOfferModal(true)
   }

   const handleScheduleAppointment = async () => {
      if (!selectedServiceId) {
         alert("Please select a service first.");
         return;
      }

      try {
         const token = await getAccessTokenSilently();
         const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/services/${selectedServiceId}/appointments`, {
            headers: {
               'Authorization': `Bearer ${token}`,
            },
         });

         const data = await response.json();
         if (data.length === 0) {
            setAppointments([]);
         } else {
            setAppointments(data); 
         }
      } catch (error) {
         console.error("Error fetching appointments:", error);
      }
   };

   const handleBook = async (slot) => {
      if (!slot) {
         alert("Please select a time slot first.");
         return;
      }

      try {
         const token = await getAccessTokenSilently();
         const selectedAppointment = appointmentMap[selectedTimeSlot];
         const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/services/book/${selectedAppointment}`, {
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               customer_id: user.sub
            })
         });

         if (response.ok) {
            alert("Appointment booked!");
            window.location.reload();
         } else {
            alert("Failed to book. Try again.");
         }
      } catch (error) {
         console.error("Error booking appointment:", error);
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

   const handleCloseModal = (e) => {
      e.stopPropagation();  // Prevents modal from closing when clicking inside
      if (isEditing) {
         setShowConfirm(true); // Show confirmation popup if editing
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

const renderAppointments = (appointments) => {
    return appointments.map((appt) => {
        let cleanDate = appt.date.substring(0, 10);
        let time = appt.time.includes(":") ? appt.time : `${appt.time}:00`;

        const appointmentDateString = `${cleanDate}T${time}`;
        const appointmentDate = new Date(appointmentDateString);

        if (isNaN(appointmentDate.getTime())) {
            console.error("Invalid Date:", appointmentDateString);
            return null;
        }

        const formattedDate = format(appointmentDate, 'MM/dd/yyyy, hh:mm a');

        return (
            <Dropdown.Item key={appt.appointment_id} eventKey={formattedDate}>
                {formattedDate}
            </Dropdown.Item>
        );
    });
};
   const handleReportClick = () => {
      // setReportingItemId(currUserId);
       setShowReportModal(true);
   };
  
    const submitReport = async (reason, description) => {
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: 'post',
            reportedItemId: listing.id,
            reason,
            description
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to submit report');
        }
  
        setShowReportModal(false);
        setReportingItemId(null);
        alert('Report submitted successfully');
      } catch (error) {
        console.error('Error reporting comment:', error);
        alert('Failed to submit report');
      }
    };


   return (
      <div className={styles.modalOverlay} onClick={handleCloseModal}>
         <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
               <button className={styles.closeButton} onClick={handleCloseModal}>✕</button>
               <div className={styles.modalTitle}>
                  {isEditing ? (
                     <Form.Control type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  ) : (
                     listing?.title
                  )}
               </div>
               <div>
                  <FaMapPin size={20} color="red" className={styles.locationIcon} />
                  {/* Check if 'listing' exists before accessing 'location' */}
                  <span className={styles.location}>
                     {location}
                  </span>
               </div>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
               {/* Image Section */}
               <div className={styles.carouselContainerImages}>
                  {listing ? (
                     listing.image.length > 1 ? (
                        <Carousel>
                           {listing.image.map((img, index) => (
                              <Carousel.Item key={index}>
                                 <img src={img} alt={`Slide ${index}`} />
                              </Carousel.Item>
                           ))}
                        </Carousel>
                     ) : (
                        <img src={listing.image[0]} alt={listing.title} className={styles.img} />
                     )
                  ) : (
                     <p>Loading...</p>
                  )}
               </div>

               {/* Content Section */}
               <div className={styles.content}>
                  <div className={styles.priceAndButtons}>
                     <h5>
                        {isEditing ? (
                           <Form.Control
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                           />
                        ) : (
                           `$${listing?.price}`
                        )}
                     </h5>
                     {console.log(listing)}
                     {isOwner ? (
                        <div className={styles.editButtons}>
                           {isEditing ? (
                              <>
                                 <Button variant="success" onClick={handleSaveClick}>Save</Button>
                                 <Button variant="warning" onClick={handleCancelClick}>Cancel</Button>
                              </>
                           ) : (
                              <Button variant="secondary" onClick={handleEditClick}>Edit</Button>
                           )}
                           <Button variant="danger" onClick={handleDeleteClick}>Delete</Button>
                        </div>
                     ) : (
                        <div className={styles.profileInfo}>
                           <span>{listing?.author}</span>
                           <Link to={`/profile/${listing?.user_id}`}>
                              <img src={listing?.profile} alt="Profile" className={styles.profilePic} />
                           </Link>
                        </div>
                     )}
                  </div>

                  <div className="col-md-6">
                     <div className={styles.reportSection}>
                        {!isOwner && (                     
                        <>
                           <Button
                              variant="dark"
                              className={`${styles.reportButton}`}
                              onClick={handleReportClick}>
                              <FaFlag className="me-2" />
                              Report Listing
                           </Button>
                        </>
                        )}
                        <ReportModal 
                        show={showReportModal}
                        onHide={() => setShowReportModal(false)}
                        onSubmit={submitReport}
                        itemType="Listing"
                        />
                     </div>
                  </div>
                  
                  {/* Product/Service Options Dropdown */}
                  {isServiceListing && !selectedServiceId && (
                     <div className={styles.productOptions}>
                        <label htmlFor="product-options-dropdown">
                           Service Options
                        </label>
                        <Dropdown>
                           <Dropdown.Toggle variant="outline-light" className={styles.dropdownToggle}>
                              {dropDownTitle}
                           </Dropdown.Toggle>

                           <Dropdown.Menu className={styles.dropdownMenu}>
                              {dropdownOptions.map(option => (
                                 <Dropdown.Item key={option.value} onClick={() => handleDropDownClick(option)}>
                                    {option.label}
                                 </Dropdown.Item>
                              ))}
                           </Dropdown.Menu>
                        </Dropdown>
                     </div>
                  )}

                  {/* Schedule Appointment Section for Services */}
                  {isServiceListing && selectedServiceId && (
                     <div className={styles.scheduleAppointmentSection}>
                        {/* Available Time Slot Dropdown */}
                        <label htmlFor="time-slot-dropdown">
                           {listing.services.find(service => service.service_id === selectedServiceId)?.service_name}
                           - ${listing.services.find(service => service.service_id === selectedServiceId)?.service_price || 'N/A'}
                        </label>
                        <Dropdown onSelect={(e) => setSelectedTimeSlot(e)}>
                           <Dropdown.Toggle variant="outline-light" className={styles.dropdownToggle}>
                              {selectedTimeSlot ? selectedTimeSlot : 'Choose a time'}
                           </Dropdown.Toggle>
                           <Dropdown.Menu className={styles.dropdownMenu}>
                              {appointments.length > 0 ? (
                                 renderAppointments(appointments)
                              ) : (
                                 <Dropdown.Item>No available slots</Dropdown.Item>
                              )}
                           </Dropdown.Menu>
                        </Dropdown>

                        {/* Book Appointment and Cancel Button */}
                        <div className={styles.actionButtons}>
                           <Button
                              variant="success"
                              className="mt-2"
                              onClick={() => handleBook(selectedTimeSlot)}
                           >
                              Book Appointment
                           </Button>
                           <Button
                              variant="secondary"
                              className="mt-2"
                              onClick={() => {
                                 setSelectedServiceId(null); 
                                 setSelectedTimeSlot(null); 
                                 setAppointments([]); 
                              }}
                           >
                              Cancel
                           </Button>
                        </div>
                     </div>
                  )}

                  {/* For non-service listings, do not show product options */}
                  {!isServiceListing && !isEditing && (
                     <div className={styles.offerSellerButton}>
                        <Button
                           variant="dark"
                           className="mb-2"
                           onClick={handleOfferSeller}
                        >
                           Offer Seller!
                        </Button>
                        <OfferModal
                           show={showOfferModal}
                           onHide={() => setShowOfferModal(false)}
                           listing={listing}
                        />
                     </div>
                  )}


                  {/* Message Seller Button */}
                  <div className={styles.messageSellerButton}>
                     <Button variant="dark" onClick={handleMessageSeller}>Message Seller!</Button>
                  </div>

                  {/* Description */}
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
            </div>


            {/* Modal Footer */}
            <div className={styles.modalFooter}>
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
            </div>

            {/* Confirmation Popup */}
            <div className={`${styles.confirmationPopup} ${showConfirm ? styles.show : ''}`}>
               <div className={styles.confirmationContent}>
                  <p>You have unsaved changes. Are you sure you want to exit?</p>
                  <Button variant="secondary" onClick={() => setShowConfirm(false)}>No, Stay</Button>
                  <Button variant="danger" onClick={confirmExit}>Yes, Exit</Button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ListingModal;