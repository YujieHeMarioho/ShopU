import React from 'react';
import { Banner, CardGrid, FilterSidebar } from '../../Common';
import { Button } from 'react-bootstrap';

function Favorites() {
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

  return (
    <div>
      <Banner
        title="Your Favorites"
        description="Here are your saved listings."
      />

      <div className="d-flex">
        {/* Filter Sidebar */}
        <FilterSidebar />

        {/* Render CardGrid with listings */}
        <CardGrid listings={listings} />
      </div>
    </div>
  );
}

export default Favorites;
