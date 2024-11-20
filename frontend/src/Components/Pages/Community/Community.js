import React from 'react';
import { Banner, CommunityCardGrid, FilterSidebar } from '../../Common';
import { Button } from 'react-bootstrap';

function Communities() {
  // Sample Community data
  const communities = [
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Community 1',
      description: 'This is a description for community 1.',
    },
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Community 2',
      description: 'This is a description for community 2.',
    },
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Community 3',
      description: 'This is a description for community 3.',
    },
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Community 4',
      description: 'This is a description for community 4.',
    },
    {
      image: 'https://via.placeholder.com/300x200',
      title: 'Community 5',
      description: 'This is a description for community 5.',
    },
  ];

  return (
    <div>
      <Banner
        title="Communities"
        description="Here are some communities you might like."
      />

      <div className="d-flex">
        {/* Filter Sidebar */}
        <FilterSidebar />

        {/* Render CardGrid with listings */}
        <CommunityCardGrid communities={communities} />
      </div>
    </div>
  );
}

export default Communities;
