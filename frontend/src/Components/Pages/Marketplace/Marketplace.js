import React from 'react';
import { Banner, Statistics, CardGrid, FilterSidebar } from '../../Common';
import { Button } from 'react-bootstrap';

function Marketplace() {
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

  const handleCreateListing = () => {
    // Action to take when the button is clicked
    alert("Redirecting to create a new listing...");
    // Later replace this with routing or showing a modal for creating the listing.
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
