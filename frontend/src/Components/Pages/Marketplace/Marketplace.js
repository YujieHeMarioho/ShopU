import React, { useState, useEffect, useMemo } from 'react';
import { Banner, CardGrid, FilterSidebar } from '../../Common';
import { Form, ListGroup, Modal, Button } from 'react-bootstrap';
import Fuse from 'fuse.js';  // Import Fuse.js library
import styles from './Marketplace.module.css'; // Import CSS module for styling
import { useNavigate, useLocation } from 'react-router-dom';
import ListingModal from './Listings';
import { useAuth0 } from '@auth0/auth0-react';

export const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [filteredResults, setFilteredResults] = useState(listings);  // Default to show all listings
  const [suggestions, setSuggestions] = useState([]); // Store suggested search results
  const [isDropdownVisible, setDropdownVisible] = useState(false); // Control visibility of suggestions
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const location = useLocation();

  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  // Fuse.js setup for fuzzy search
  const fuse = useMemo(() => {
    const options = {
      includeScore: true,
      threshold: 0.3, // Adjust threshold for fuzziness (lower is stricter)
      keys: ['title', 'description'], // Fields to search in each listing
    };
    return new Fuse(listings, options);
  }, []);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      // Perform a fuzzy search for suggestions, apply filters first
      const filteredData = applyFilters(listings);
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
          if (selectedRating === '3 stars+') return rating >= 3.0;
          if (selectedRating === '4 stars+') return rating >= 4.0;
          if (selectedRating === '5 stars') return rating == 5.0;
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
      let filtered = applyFilters(listings);

      // Apply filters from activeFilters (categories, type, ratings)
      //filtered = applyFilters(filtered);

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
  }, [listings, searchQuery, activeFilters]);

  //Sets the active filters based on the query params in the url
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const listingId = params.get('listingId');
    if (category) {
      setActiveFilters(prevFilters => ({
        ...prevFilters,
        categories: [category],
      }));
    }
    if (listingId) {
      setActiveFilters(prevFilters => ({
        ...prevFilters,
        listingId: [listingId],
      }));
    }
  }, [location]);

  useEffect(() => {
    // Fetch the most recent listings from the server
    const fetchListings = async () => {
      try {
        const token = await getAccessTokenSilently();

        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        const rawData = await response.json();
  
        // Map the data to match the desired format, now including user_id
        const formattedData = rawData.map(item => ({
          id: item.listing_id,
          user_id: item.user_id,  // NEW: Include the seller's user_id
          title: item.title,
          description: item.description,
          category: item.category,
          type: item.item_type,
          rating: item.star_rating,
          price: item.price,
          image: item.file_keys,  // or item.file_keys[0] if you only want one image
          author: item.author,
          profile: item.profile,
          location: item.location
        }));

        setListings(formattedData);
        // If there's a listingId in the URL, open the modal for that listing
        if (activeFilters.listingId) {
          const selectedListing = formattedData.find(listing => listing.id.toString() === activeFilters.listingId.toString());
          if (selectedListing) {
            setSelectedListing(selectedListing);
            setShowListingModal(true);
          }
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
      }
    };
  
    fetchListings();
  }, [activeFilters]);

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

  // Close modal for creating listing
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

  // Handler when user clicks a listing
  const handleCardClick = (listing) => {
    setSelectedListing(listing);
    setShowListingModal(true);
  };

  // Close modal for listing popup
  const handleCloseListingModal = () => {
    setShowListingModal(false);
    setSelectedListing(null);
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
            onFilterChange={handleFilterChange}
            initialFilters={activeFilters}
            className={styles.filterSidebar}
          />
        </div>

        {/* Card Grid displaying filtered results */}
        <div className={styles.cardGridContainer}>
          <CardGrid listings={filteredResults} className={styles.cardGrid} openListingDetails={handleCardClick} />
        </div>
      </div>

      <ListingModal show={showListingModal} onHide={handleCloseListingModal} listing={selectedListing} />
    </div>
  );

};

export default Marketplace;