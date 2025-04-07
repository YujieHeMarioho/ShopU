import React, { useState, useEffect, useMemo } from 'react';
import { Banner, CardGrid, FilterSidebar } from '../../Common';
import { Form, ListGroup, Modal, Button } from 'react-bootstrap';
import Fuse from 'fuse.js';
import styles from './Marketplace.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import ListingModal from './Listings';
import { useAuth0 } from '@auth0/auth0-react';

export const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [filteredResults, setFilteredResults] = useState(listings);
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const location = useLocation();

  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  const fuse = useMemo(() => {
    const options = {
      includeScore: true,
      threshold: 0.3,
      keys: ['title', 'description'],
    };
    return new Fuse(listings, options);
  }, [listings]); // Update dependency to listings

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      const filteredData = applyFilters(listings);
      const results = fuse.search(query).filter(result => filteredData.includes(result.item));
      setSuggestions(results.slice(0, 5).map(result => result.item));
      setDropdownVisible(true);
    } else {
      setSuggestions([]);
      setDropdownVisible(false);
    }
  };

  const applyFilters = (data) => {
    let filtered = data;
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
          if (selectedRating === '5 stars') return rating === 5.0;
          return false;
        });
      });
    }
    return filtered;
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.title);
    setDropdownVisible(false);
  };

  useEffect(() => {
    const filterListings = () => {
      let filtered = applyFilters(listings);
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const listingId = params.get('listingId');
    setActiveFilters((prevFilters) => ({
      ...prevFilters,
      categories: category ? [category] : prevFilters.categories,
      listingId: listingId || null, // Store as string or null
    }));

    // Open modal if listingId is in URL
    if (listingId && listings.length > 0) {
      const listing = listings.find(l => l.id.toString() === listingId.toString());
      if (listing) {
        setSelectedListing(listing);
        setShowListingModal(true);
      }
    } else {
      setShowListingModal(false);
      setSelectedListing(null);
    }
  }, [location, listings]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const rawData = await response.json();
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
          author: item.author,
          profile: item.profile,
          location: item.location,
          services: item.services,
        }));
        setListings(formattedData);
      } catch (error) {
        console.error('Error fetching listings:', error);
      }
    };
    fetchListings();
  }, [getAccessTokenSilently]); // Remove activeFilters from deps to avoid re-fetching unnecessarily

  const handleFilterChange = (filter) => {
    setActiveFilters(prevState => ({
      ...prevState,
      ...filter,
      listingId: null, // Reset listingId when filters change
    }));
    navigate('/marketplace'); // Reset URL to base marketplace when filters change
  };

  const handleCreateListing = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleNewItemListing = () => {
    setShowModal(false);
    navigate('/create-item-listing');
  };

  const handleNewServiceListing = () => {
    setShowModal(false);
    navigate('/create-service-listing');
  };

  const handleCardClick = (listing) => {
    navigate(`/marketplace?listingId=${listing.id}`); // Navigate to unique URL
    setSelectedListing(listing);
    setShowListingModal(true);
  };

  const handleCloseListingModal = () => {
    setShowListingModal(false);
    setSelectedListing(null);
    navigate('/marketplace'); // Reset URL when modal closes
  };

  return (
    <div>
      <div className={styles.marketplaceContainer}>
        <div className="my-4">
          <Form.Control
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchBar}
          />
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
          <div className={styles.createListingButtonContainer}>
            <Button className={styles.createListingButton} onClick={handleCreateListing}>
              Create New Listing
            </Button>
          </div>
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
        <div className={styles.layoutContainer}>
          <div className={styles.filterSidebarContainer}>
            <FilterSidebar onFilterChange={handleFilterChange} initialFilters={activeFilters} />
          </div>
          <div className={styles.cardGridContainer}>
            <CardGrid
              listings={filteredResults}
              className={styles.cardGrid}
              openListingDetails={handleCardClick}
            />
          </div>
        </div>
      </div>
      {showListingModal && (
        <ListingModal
          show={showListingModal}
          onHide={handleCloseListingModal}
          listing={selectedListing}
        />
      )}
    </div>
  );
};

export default Marketplace;