import React, { useState, useEffect, useMemo } from 'react';
import { Banner, CardGrid, FilterSidebar } from '../../Common';
import { Form, ListGroup, Modal, Button } from 'react-bootstrap';
import Fuse from 'fuse.js';  // Import Fuse.js library
import styles from './Marketplace.module.css'; // Import CSS module for styling
import { useNavigate } from 'react-router-dom';

// Dummy data for marketplace listings
const dummyData = [
  {
    id: 1,
    title: 'Vintage Chair',
    description: 'A beautiful vintage chair, lightly used.',
    category: 'Furniture',
    type: 'item',
    rating: 4,
    price: 50,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 2,
    title: 'Tutoring for Calculus',
    description: 'Experienced tutor available for Calculus lessons.',
    category: 'Education',
    type: 'service',
    rating: 5,
    price: 100,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 3,
    title: 'Gaming Laptop',
    description: 'High-performance gaming laptop for sale.',
    category: 'Electronics',
    type: 'item',
    rating: 4.5,
    price: 1200,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 4,
    title: 'Photography Session',
    description: 'Offering professional photography sessions.',
    category: 'Photography',
    type: 'service',
    rating: 3,
    price: 150,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 5,
    title: 'Yoga Mat',
    description: 'Eco-friendly yoga mat, new condition.',
    category: 'Fitness',
    type: 'item',
    rating: 4,
    price: 20,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 6,
    title: 'Dining Table Set',
    description: 'Solid wood dining table set with 4 chairs.',
    category: 'Furniture',
    type: 'item',
    rating: 5,
    price: 350,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 7,
    title: 'Guitar Lessons',
    description: 'Learn guitar with an experienced instructor.',
    category: 'Education',
    type: 'service',
    rating: 4.5,
    price: 50,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 8,
    title: 'Smartphone',
    description: 'Latest model smartphone with 128GB storage.',
    category: 'Electronics',
    type: 'item',
    rating: 4.2,
    price: 800,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 9,
    title: 'Video Editing Service',
    description: 'Professional video editing for personal or business needs.',
    category: 'Photography',
    type: 'service',
    rating: 5,
    price: 200,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 10,
    title: 'Fitness Training',
    description: 'Personalized fitness training sessions.',
    category: 'Fitness',
    type: 'service',
    rating: 4.8,
    price: 80,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 11,
    title: 'Office Chair',
    description: 'Ergonomic office chair, excellent condition.',
    category: 'Furniture',
    type: 'item',
    rating: 4.3,
    price: 120,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 12,
    title: 'Website Development',
    description: 'Custom website development for small businesses.',
    category: 'Services',
    type: 'service',
    rating: 4.7,
    price: 1500,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 13,
    title: 'Wrist Watch',
    description: 'Luxury wrist watch, used but in good condition.',
    category: 'Accessories',
    type: 'item',
    rating: 4.9,
    price: 300,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 14,
    title: 'Bicycle for Sale',
    description: 'Mountain bike in excellent condition.',
    category: 'Sports',
    type: 'item',
    rating: 4.2,
    price: 250,
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: 15,
    title: 'Art Supplies',
    description: 'Set of high-quality art supplies for artists.',
    category: 'Art',
    type: 'item',
    rating: 4.8,
    price: 60,
    image: 'https://via.placeholder.com/300x200',
  },
];

export const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [filteredResults, setFilteredResults] = useState(dummyData);  // Default to show all listings
  const [suggestions, setSuggestions] = useState([]); // Store suggested search results
  const [isDropdownVisible, setDropdownVisible] = useState(false); // Control visibility of suggestions
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Fuse.js setup for fuzzy search
  const fuse = useMemo(() => {
    const options = {
      includeScore: true,
      threshold: 0.3, // Adjust threshold for fuzziness (lower is stricter)
      keys: ['title', 'description'], // Fields to search in each listing
    };
    return new Fuse(dummyData, options);
  }, []);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      // Perform a fuzzy search for suggestions, apply filters first
      const filteredData = applyFilters(dummyData);
      const results = fuse.search(query).filter(result => filteredData.includes(result.item));
      setSuggestions(results.slice(0, 5).map(result => result.item)); // Show top 5 suggestions
      setDropdownVisible(true);
    } else {
      setSuggestions([]);
      setDropdownVisible(false);
    }
  };

  // Apply filters before returning data for search
  const applyFilters = (data) => {
    let filtered = data;

    // Apply filters from activeFilters (categories, type, ratings)
    if (activeFilters.categories && activeFilters.categories.length > 0) {
      filtered = filtered.filter((listing) =>
        activeFilters.categories.includes(listing.category)
      );
    }

    if (activeFilters.type && activeFilters.type !== 'both') {
      filtered = filtered.filter((listing) => listing.type === activeFilters.type);
    }

    if (activeFilters.ratings && activeFilters.ratings.length > 0) {
      filtered = filtered.filter((listing) => {
        const rating = listing.rating || 0;
        return activeFilters.ratings.some((selectedRating) => {
          if (selectedRating === '3 stars+') return rating >= 3;
          if (selectedRating === '4 stars+') return rating >= 4;
          if (selectedRating === '5 stars') return rating === 5;
          return false;
        });
      });
    }

    return filtered;
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.title); // Update the search query with the suggestion
    setDropdownVisible(false); // Hide the suggestions dropdown
  };

  // Filter listings based on search query and active filters
  useEffect(() => {
    const filterListings = () => {
      let filtered = dummyData;

      // Apply filters from activeFilters (categories, type, ratings)
      filtered = applyFilters(filtered);

      // Apply fuzzy search after filters are applied
      if (searchQuery) {
        filtered = filtered.filter((listing) =>
          listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setFilteredResults(filtered);
    };

    filterListings();
  }, [searchQuery, activeFilters]);

  // useEffect(() => {
  //   // Fetch the most recent listings from the server
  //   const fetchListings = async () => {
  //     try {
  //       const response = await fetch('http://localhost:8080/api/listings');
  //       const data = await response.json();
  //       setListings(data);
  //     } catch (error) {
  //       console.error('Error fetching listings:', error);
  //     }
  //   };

  //   fetchListings();
  // }, []);

  // Filter change handler (when filter options are selected or modified)
  const handleFilterChange = (filter) => {
    setActiveFilters(prevState => ({
      ...prevState,
      ...filter,
    }));
  };

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
    <div className={styles.marketplaceContainer}>
      {/* Search Bar */}
      <div className="my-4">
        <Form.Control
          type="text"
          placeholder="Search listings..."
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchBar}
        />
  
        {/* Show suggestions if dropdown is visible */}
        {isDropdownVisible && suggestions.length > 0 && (
          <ListGroup className={styles.suggestionsDropdown}>
            {suggestions.map((suggestion) => (
              <ListGroup.Item
                key={suggestion.id}
                action
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.title}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

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
      </div>
  
      {/* Layout container for the filter sidebar and card grid */}
      <div className={styles.layoutContainer}>
        {/* Filter Sidebar */}
        <div className={styles.filterSidebarContainer}>
          <FilterSidebar
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            className={styles.filterSidebar}
          />
        </div>
  
        {/* Card Grid displaying filtered results */}
        <div className={styles.cardGridContainer}>
          <CardGrid listings={filteredResults} className={styles.cardGrid} />
        </div>
      </div>

      <ListingModal show={showModal} onHide={handleCloseModal} listing={selectedListing} />
    </div>
  );
  
};

export default Marketplace;