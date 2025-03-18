import React, { useState, useEffect, useMemo } from 'react';
import { CardGrid, FilterSidebar, SocialCard, CommentSection } from '../../Common';
import { Form, ListGroup, Modal } from 'react-bootstrap';
import Fuse from 'fuse.js';  // Import Fuse.js library
import styles from './Favorites.module.css'; // Import CSS module for styling
import ListingModal from './../Marketplace/Listings';
import { useAuth0 } from "@auth0/auth0-react";
import Masonry from 'react-masonry-css';
import { useInView } from 'react-intersection-observer';

export const Favorites = () => {
  const [listings, setListings] = useState([]);
  const [feed, setFeed] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [filteredResults, setFilteredResults] = useState(listings);  // Default to show all listings
  const [suggestions, setSuggestions] = useState([]); // Store suggested search results
  const [isDropdownVisible, setDropdownVisible] = useState(false); // Control visibility of suggestions
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [viewMode, setViewMode] = useState('listings');  // State to toggle between Listings and Posts
  const [isGridLayout, setIsGridLayout] = useState(true);
  const { ref, inView } = useInView({ threshold: 0.5 });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [error, setError] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();

  const userId = isAuthenticated ? user?.sub : null;

  const handleResize = () => {
    if (window.innerWidth < 991) {
      setIsGridLayout(false); // Set to false for mobile view (less than 991px)
    } else {
      setIsGridLayout(true); // Set to true for desktop view (991px and above)
    }
  };

  useEffect(() => {
    // Initial check on component mount
    handleResize();

    // Add event listener to listen for window resize
    window.addEventListener('resize', handleResize);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

  const handleUnfavorite = (unfavoritedId) => {
    // Remove unfavorited listing from favorited listings 
    setListings(listings => listings.filter(fav => fav.id !== unfavoritedId));
  };

  const closeCardModal = () => {
    setSelectedCard(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  
  const reloadFeed = async (pageArg) => {
    fetchFeed(pageArg);
  };

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
          image: item.file_keys,
        }));
    
        setListings(formattedData);
      } catch (error) {
        console.error('Error fetching listings:', error);
      }
    };

    fetchListings();
  }, [user]);

  useEffect(() => {
    fetchFeed();
  }, []);

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

  const handleShowComments = (post_id) => {
    setSelectedPostId(post_id);
    setShowComments(true);
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedPostId(null);
  };

   // Fetch the most recent favorite feed posts from the server
   const fetchFeed = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/favorites`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      const rawFeed = await response.json();
      if (rawFeed.length === 0) setHasMore(false);
  
      // Mark the posts as favorited
      const updatedFeed = rawFeed.map(post => {
        return {
          ...post,
          isFavorited: true,  // Assuming that if it comes from the favorites endpoint, it is favorited
        };
      });
  
      setFeed((prevFeed) => {
        const existingPostIds = new Set(prevFeed.map((post) => post.post_id));
        const newPosts = updatedFeed.filter((post) => !existingPostIds.has(post.post_id));
        return [...prevFeed, ...newPosts];
      });
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('Failed to load feed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  

  if (!user) {
    return null;
  }

  return (
    <div className={styles.favoritesContainer}>
       <div className={styles.buttonContainer}>
        <button
          className={`${styles.toggleButton} ${viewMode === 'listings' ? styles.active : ''}`}
          onClick={() => setViewMode('listings')}
        >
          Listings
        </button>
        <button
          className={`${styles.toggleButton} ${viewMode === 'posts' ? styles.active : ''}`}
          onClick={() => setViewMode('posts')}
        >
          Posts
        </button>
      </div>
      {/* Search Bar */}
      {viewMode === 'listings' && (<div className="my-4">
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
          </div>)}
      {/* Conditionally render based on the viewMode */}
      {viewMode === 'listings' ? (
        
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
            <CardGrid
              listings={filteredResults}
              onUnfavorite={handleUnfavorite}
              className={styles.cardGrid}
              openListingDetails={handleCardClick}
            />
          </div>
        </div>
      ) : (
        <div className={styles.feedPostsContainer}>
           <div
                className={styles.feedContainer}
            >{isGridLayout ? (
                <Masonry
                  breakpointCols={{ default: 8, 2816:7, 2560: 6, 2176: 5, 1920: 4, 1536: 3, 1280:2,  768: 1 }}
                  className={styles.masonryGrid}
                  columnClassName={styles.masonryColumn}
                >
                  {feed.map((post, index) => (
                    <div
                      key={post.post_id}
                      className={styles.gridItem}
                      ref={index === feed.length - 1 ? ref : null}
                      onClick={() => handleCardClick(post)}
                    >
                      <SocialCard
                        post_id={post.post_id}
                        image={post.image}
                        title={post.title}
                        description={post.content}
                        profilePic={post.profile}
                        author={post.author}
                        authorId={post.author_id}
                        initialLikes={post.likes_count}
                        initialShares={post.shares}
                        isLikedAlready={post.isliked}
                        isFavoritedAlready={post.isFavorited}
                        tags={post.tags}
                        listingId={post.listing_id}
                        onShowComments={() => handleShowComments(post.post_id)}
                        reloadFeed={reloadFeed}
                        allFriends={friends}
                        friendsLoading={friendsLoading}
                      />
                    </div>
                  ))}
                </Masonry>
              ) : (
                <div className={styles.scrollView}>
                  {feed.map((post, index) => (
                    <div
                      key={post.post_id}
                      className={styles.scrollItem}
                      ref={index === feed.length - 1 ? ref : null}
                      onClick={() => handleCardClick(post)}
                    >
                      <SocialCard
                        post_id={post.post_id}
                        image={post.image}
                        title={post.title}
                        description={post.content}
                        profilePic={post.profile}
                        author={post.author}
                        authorId={post.author_id}
                        initialLikes={post.likes_count}
                        initialShares={post.shares}
                        isLikedAlready={post.isliked}
                        tags={post.tags}
                        listingId={post.listing_id}
                        onShowComments={() => handleShowComments(post.post_id)}
                        reloadFeed={reloadFeed}
                        allFriends={friends}
                        friendsLoading={friendsLoading}
                      />
                    </div>
                  ))}
                </div>
              )}
              {loading && <p>Loading more posts...</p>}
        </div>
        <Modal show={!!selectedCard} onHide={closeCardModal} centered>
        <Modal.Header closeButton />
        <Modal.Body className={styles.modalBody}>
          {selectedCard && (
            <SocialCard
              post_id={selectedCard.post_id}
              image={selectedCard.image}
              title={selectedCard.title}
              description={selectedCard.content}
              profilePic={selectedCard.profile}
              author={selectedCard.author}
              authorId={selectedCard.author_id}
              initialLikes={selectedCard.likes_count}
              initialShares={selectedCard.shares}
              isLikedAlready={selectedCard.isliked}
              tags={selectedCard.tags}
              listingId={selectedCard.listing_id}
              onShowComments={() => handleShowComments(selectedCard.post_id)}
              reloadFeed={reloadFeed}
              allFriends={friends}
              friendsLoading={friendsLoading}
            />
          )}
        </Modal.Body>
      </Modal>

    
      {/* Comments Modal */}
      <Modal  show={showComments}
        onHide={handleCloseComments}
        animation={true}
        className="bottom-modal"
        dialogClassName="modal-dialog-bottom">
        <Modal.Header closeButton>
          <Modal.Title style={{ color: 'black' }}>Comments</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CommentSection selectedPostId={selectedPostId} userId={userId} />
        </Modal.Body>
      </Modal>
        
        </div>
      )}
    </div>
  );
};

export default Favorites;
