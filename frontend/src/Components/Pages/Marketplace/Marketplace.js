import React, { useState, useEffect, useMemo } from 'react';
import { Banner, CardGrid, FilterSidebar } from '../../Common';
import { Form, ListGroup, Modal, Button } from 'react-bootstrap';
import Fuse from 'fuse.js';
import styles from './Marketplace.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import ListingModal from './Listings';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

export const Marketplace = () => {
  const [baseListings, setBaseListings] = useState([]);
  const [finalListings, setFinalListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setListingRecommendations] = useState([]);
  const [recommendationsError, setRecommendationsError] = useState(false);
  const [error, setError] = useState(null);


  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [filteredResults, setFilteredResults] = useState(baseListings);  // Default to show all listings
  const [suggestions, setSuggestions] = useState([]); // Store suggested search results
  const [isDropdownVisible, setDropdownVisible] = useState(false); // Control visibility of suggestions
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
    return new Fuse(baseListings, options);
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      // Perform a fuzzy search for suggestions, apply filters first
      const filteredData = applyFilters(baseListings);
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
      let filtered = applyFilters(finalListings);

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
      if (activeFilters.listingId?.[0]) {
        const selectedListing = finalListings.find(
          (listing) => listing.id === activeFilters.listingId[0]
        );
        if (selectedListing) {
          setSelectedListing(selectedListing);
          setShowListingModal(true);
        }
      }
      
    
    };
    filterListings();
  }, [finalListings, searchQuery, activeFilters]);

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

   // Fetch listings
   const fetchListings = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
        services: item.services
      }));

      setBaseListings(formattedData);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    try {
      const token = await getAccessTokenSilently();

      if (!token) {
        setError("Authorization token missing");
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { current_page: 'listings' },
      });

      console.log("API Response:", response.data);

      const { recommendations } = response.data;
      if (recommendations && recommendations.listing_recommendations) {
        setListingRecommendations(recommendations.listing_recommendations);
      } else {
        setError("No listing recommendations found");
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setError("Failed to fetch recommendations");
      setRecommendationsError(true);
    }
  };

  // Wait for both baseListings and recommendations to have data
  const fetchData = async () => {
    try {
      // Check if both baseListings and recommendations have data
      if (baseListings.length === 0) {
        return;
      }

      if(recommendations.length == 0){
        setFinalListings(baseListings);
        setLoading(false);
        return;
      }

      const listingMap = new Map(baseListings.map(l => [l.id, l]));

      // Reorder listings according to the recommended order
      const ordered = recommendations
        .map(rec => {
          // Convert both to strings before comparison
          const listing = listingMap.get(String(rec.listing_id)); 
          return listing;
        })
        .filter(Boolean); // Filter out any undefined values (if a listing is not found)

      setFinalListings(ordered);
    } catch (error) {
      console.error("Error processing data:", error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect to fetch listings and recommendations only once
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchListings(), fetchRecommendations()]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);  // Empty dependency array to run only once

  // useEffect to process data once both listings and recommendations are available
  useEffect(() => {
    if (baseListings.length > 0 &&  (recommendations.length > 0 || recommendationsError)) {
      fetchData(); // Fetch data after both have content
    }
  }, [baseListings, recommendations, recommendationsError]); 


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

  // Handler when user clicks a listing
  const handleCardClick = async (listing) => {
    setSelectedListing(listing);
    setShowListingModal(true);
    try {
      const token = await getAccessTokenSilently();
      // Passing listing_id as a query parameter in the URL
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/view?listing_id=${listing.id}`, {
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!response.ok) {
        throw new Error("Failed to track view");
      }
  
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };
  
  // Close modal for listing popup
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

        {/* Card Grid displaying filtered results */}
        {loading ? (
          <div className={styles.cardGridContainer}>
            <div className="spinner-border text-primary" role="status"></div>
            <p>Loading listings...</p>
          </div>
        ) : (
        <div className={styles.cardGridContainer}>
          <CardGrid listings={filteredResults} className={styles.cardGrid} openListingDetails={handleCardClick} />
        </div>
        )}
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