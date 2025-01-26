import React, { useState, useEffect, useMemo } from 'react';
import { CardGrid, FilterSidebar } from '../../Common';
import { Form, ListGroup } from 'react-bootstrap';
import Fuse from 'fuse.js';  // Import Fuse.js library
import styles from './Favorites.module.css'; // Import CSS module for styling
import ListingModal from './../Marketplace/Listings';
import { useAuth0 } from "@auth0/auth0-react";

export const Favorites = () => {
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [filteredResults, setFilteredResults] = useState(listings);  // Default to show all listings
  const [suggestions, setSuggestions] = useState([]); // Store suggested search results
  const [isDropdownVisible, setDropdownVisible] = useState(false); // Control visibility of suggestions
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  const { user, getAccessTokenSilently } = useAuth0();  

  // Fuse.js setup for fuzzy search
  const fuse = useMemo(() => {
    if (!user) {
      return;
    }
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
    if (!user) {
      return;
    }
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
  }, [user, listings, searchQuery, activeFilters]);

  useEffect(() => {
    if (!user) {
      return;
    }
    // Fetch the most recent listings from the server
    const fetchListings = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/favorites/`,{
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });       
        const rawData = await response.json();
    
        // Map the data to match the desired format
        const formattedData = rawData.map(item => ({
          id: item.listing_id,
          title: item.title,
          description: item.description,
          category: item.category,
          type: item.item_type,
          rating: item.star_rating,
          price: item.price,
          image: item.image_url,
        }));
    
        setListings(formattedData);
      } catch (error) {
        console.error('Error fetching listings:', error);
      }
    };

    fetchListings();
  }, [user]);

  // Filter change handler (when filter options are selected or modified)
  const handleFilterChange = (filter) => {
    setActiveFilters(prevState => ({
      ...prevState,
      ...filter,
    }));
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

  if (!user) {
    return null;
  }

  return (
    <div className={styles.favoritesContainer}>
      {/* Search Bar */}
      <div className="my-4">
        <Form.Control
          type="text"
          placeholder="Search favorited listings..."
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
          <CardGrid listings={filteredResults} className={styles.cardGrid} openListingDetails={handleCardClick} />
        </div>
      </div>

      <ListingModal show={showListingModal} onHide={handleCloseListingModal} listing={selectedListing} />
    </div>
  );
};

export default Favorites;
