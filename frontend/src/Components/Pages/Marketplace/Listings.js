import React, { useState } from 'react';
import { Modal, Button, Dropdown, DropdownButton, DropdownItem } from 'react-bootstrap';
import './Listings.css'; 

function ListingModal({ show, onHide, listing }) {
 const [dropDownTitle, setDropDownTitle] = useState('Select an Option')

  if (!listing) return null; // If no listing data, render nothing

  const handleDropDownClick = (option) => {
    setDropDownTitle(option);
  };

  return (
    <Modal show={show} onHide={onHide} dialogClassName='modal' centered>
     <Modal.Header closeButton>
       <Modal.Title className="card-title">{listing.title}</Modal.Title>
     </Modal.Header>
     <Modal.Body className="modal-body"> 
      <div>
        
      </div>
    <img src={listing.image} alt={listing.title} className="img" /> 
     <div className="content">
         <h5 className="card-price">${listing.price}</h5>
         <div className="product-options">
           <label htmlFor="product-options-dropdown" className="card-text"> Product Options </label>
           <Dropdown>
             <Dropdown.Toggle id="product-options-dropdown" variant="outline-light" className="dropdown-text"> {dropDownTitle} </Dropdown.Toggle>
             <Dropdown.Menu>
               <Dropdown.Item as="button" onClick={()=> handleDropDownClick('Drop Off Location')}>Drop Off Location</Dropdown.Item>
               <Dropdown.Item as="button" onClick={()=> handleDropDownClick('Pickup From Seller')}>Pickup From Seller</Dropdown.Item>
               <Dropdown.Item as="button" onClick={()=> handleDropDownClick('Shipped')}>Shipped</Dropdown.Item>
             </Dropdown.Menu>
           </Dropdown>
         </div>
         <Button variant="dark" className="mb-2"> Offer Seller! </Button>
         <Button variant="dark"> Message Seller! </Button>
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
