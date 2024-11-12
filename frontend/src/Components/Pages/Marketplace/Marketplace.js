import React, { useState } from 'react';
import { Banner, CardGrid, FilterSidebar } from '../../Common';
import { Button, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Marketplace() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Sample listings data
  const listings = [
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Item 1',
      description: 'This is a description for item 1.',
      price: '19.99',
    },
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Item 2',
      description: 'This is a description for item 2.',
      price: '29.99',
    },
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Item 3',
      description: 'This is a description for item 3.',
      price: '39.99',
    },
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Item 4',
      description: 'This is a description for item 4.',
      price: '49.99',
    },
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Item 5',
      description: 'This is a description for item 5.',
      price: '19.99',
    },
  ];

  // Open modal when "Create New Listing" button is clicked
  const handleCreateListing = () => {
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Navigate to create item listing page
  const handleNewItemListing = () => {
    setShowModal(false);
    navigate('/create-item-listing');
  };

  // Navigate to create service listing page
  const handleNewServiceListing = () => {
    setShowModal(false);
    navigate('/create-service-listing');
  };

  return (
    <div>
      <Banner
        title="The Marketplace"
        description="Here are our featured listings."
      />

      {/* Create New Listing Button */}
      <div className="my-4">
        <Button className="create-listing-button" onClick={handleCreateListing}>
          Create New Listing
        </Button>
      </div>

      {/* Modal for Additional Options */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ color: 'black' }}>Select Listing Type</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-grid gap-2">
            <Button variant="primary" onClick={handleNewItemListing}>
              Create New Item Listing
            </Button>
            <Button variant="secondary" onClick={handleNewServiceListing}>
              Create New Service Listing
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <div className="d-flex">
        {/* Filter Sidebar */}
        <FilterSidebar />

        {/* Render CardGrid with listings */}
        <CardGrid listings={listings} />
      </div>
    </div>
  );
}

export default Marketplace;
