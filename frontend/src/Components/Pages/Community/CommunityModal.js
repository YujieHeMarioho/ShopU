import React, { useState } from 'react';
import { Modal, Button, Dropdown, DropdownButton, DropdownItem, Carousel } from 'react-bootstrap';
import './CommunityModal.css'; 

function CommunityModal({ show, onHide, community }) {
 const [dropDownTitle, setDropDownTitle] = useState('Select an Option')

  if (!community) return null; // If no community data, render nothing

  const handleDropDownClick = (option) => {
    setDropDownTitle(option);
  };

  return (
    <Modal show={show} onHide={onHide} dialogClassName='modal' centered>
      <Modal.Header closeButton>
          <Modal.Title className='card-title'>{community.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className='modal-body'>
          <div className='carousel-container'>
              <img
                src={community.image}
                alt={community.title}
                className='img'
              />
          </div>
          <div className='content'>
            <Button variant='dark' className='mb-2'> Button 1 </Button>
            <Button variant='dark'> Button 2 </Button>
            <p className='card-text'>{community.description}</p>
          </div>
      </Modal.Body>
      <Modal.Footer>
          <h5 class='card-text'> add future similar stuff here </h5>
      </Modal.Footer>
    </Modal>
  );
}

export default CommunityModal;
