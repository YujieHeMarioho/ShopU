import React, { useState, useEffect } from 'react';
import styles from './SocialFeed.module.css';
import { Button } from 'react-bootstrap';
import { SocialCard, CommentSection, CustomModal } from '../../Common';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { FaHeart, FaRegHeart, FaTrash } from 'react-icons/fa';
import Masonry from 'react-masonry-css';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';
import { useLocation } from 'react-router-dom';


const SocialFeed = () => {
  const [feed, setFeed] = useState([]);
  const [userFeed, setUserFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isGridLayout, setIsGridLayout] = useState(true);
  const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView({ threshold: 0.5 });
  const navigate = useNavigate();
  

  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState({});
  const [likeCount, setLikeCount] = useState({});

  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  const userId = isAuthenticated ? user?.sub : null;
  const username = user?.name || 'Anonymous';

  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const postId = searchParams.get('post_id');

    if (postId && feed.length > 0) {
      const post = feed.find((p) => p.post_id.toString() === postId);
      if (post) {
        setSelectedCard(post);
      }
    }
  }, [location, feed]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 991;
      setIsMobile(mobile);
      if (mobile) setIsGridLayout(false); // Ensure grid layout is disabled on mobile
    };
  
    // Initial check
    checkMobile();
  
    // Event listener to update on window resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  

  useEffect(() => {
    if (!user) return;
    const fetchFriends = async () => {
      try {
        const token = await getAccessTokenSilently();
        const friendsResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/friends`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { user_id: user.sub },
          }
        );

        const friendDetails = await Promise.all(
          friendsResponse.data.map(async (friend) => {
            try {
              const friendRes = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/user/${encodeURIComponent(friend.friend_id)}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return {
                ...friend,
                name: friendRes.data.name || 'Unnamed User',
                profile_picture: friendRes.data.picture || 'https://via.placeholder.com/40',
              };
            } catch (err) {
              console.error('Error fetching user info for friend:', err);
              return {
                ...friend,
                name: 'Unknown User',
                profile_picture: 'https://via.placeholder.com/40',
              };
            }
          })
        );

        setFriends(friendDetails);
      } catch (error) {
        console.error('Error fetching friends:', error);
        setFriends([]);
      } finally {
        setFriendsLoading(false);
      }
    };

    fetchFriends();
  }, [user, getAccessTokenSilently]);

  const fetchFeed = async (pageNumber) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed?page=${pageNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch feed: ${response.statusText}`);
      const rawFeed = await response.json();
      if (rawFeed.length === 0) setHasMore(false);
      setFeed((prevFeed) => {
        const existingPostIds = new Set(prevFeed.map((post) => post.post_id));
        const newPosts = rawFeed.filter((post) => !existingPostIds.has(post.post_id));
        return [...prevFeed, ...newPosts];
      });
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('Failed to load feed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFeed = async () => {
    if (!userId) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch user feed: ${response.statusText}`);
      const rawUserFeed = await response.json();
      setUserFeed(rawUserFeed);
    } catch (err) {
      console.error('Error fetching user feed:', err);
    }
  };

  useEffect(() => {
    fetchFeed(page);
  }, [page]);

  useEffect(() => {
    if (inView && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [inView, hasMore, feed.length]);

  const handleShowComments = (post_id) => {
    setSelectedPostId(post_id);
    setShowComments(true);
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedPostId(null);
  };

  const createFeedPost = async () => {
    handleCreateNewPost();
  };

  const toggleLayout = () => {
    setIsGridLayout((prev) => !prev);
  };

  const handleCreateNewPost = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  const proceedToEditImage = () => {
    setShowModal(false);
    navigate('/edit-image', { state: { image: selectedImage } });
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const reloadFeed = async (pageArg) => {
    fetchFeed(pageArg);
  };

  const handleCardClick = (post) => {
    if(isGridLayout){
      setSelectedCard(post);
    }
  };

  const closeCardModal = () => {
    setSelectedCard(null);
  };

  if (loading && page === 1) return <p>Loading feed...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.socialFeedContainer}>
      <div className={styles.sidebar}>
        <h2>Social Feed</h2>
        <div className={styles.layoutToggleButton}>
          <Button onClick={toggleLayout} variant="outline-primary">
            {isGridLayout ? 'Switch to Scrolling Layout' : 'Switch to Grid Layout'}
          </Button>
        </div>
        <Button onClick={createFeedPost} variant="outline-primary">
          Create new Post
        </Button>
      </div>
      <div
        className={styles.feedContainer}
        style={
          !isMobile && isGridLayout ? { marginLeft: '260px' } : { marginLeft: '0' }
        }
      >
        {isGridLayout ? (
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
                  tags={post.tags}
                  listingId={post.listing_id}
                  onShowComments={() => handleShowComments(post.post_id)}
                  reloadFeed={reloadFeed}
                  allFriends={friends}
                  friendsLoading={friendsLoading}
                  selected={selectedCard !== null}
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

      <CustomModal 
        show={!!selectedCard} 
        onHide={closeCardModal} 
        centered 
        selectedCard={selectedCard} // Pass selectedCard here
        allFriends={friends}
        friendsLoading={friendsLoading}
      ></CustomModal>



      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ color: '#000000' }}>New Post</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ color: '#000000', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
          <p style={{ marginBottom: '20px' }}>Upload an Image</p>
          <div style={{ marginBottom: '20px' }}>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'inline-block' }} />
          </div>
          {selectedImage && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img
                src={selectedImage}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  width: 'auto',
                  height: 'auto',
                  borderRadius: '12px',
                  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={proceedToEditImage} disabled={!selectedImage}>
            Next
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Comments Modal */}
      <Modal
        show={showComments}
        onHide={handleCloseComments}
        animation={true}
        className={styles.modalDialogBottom}  // Use the CSS module class
        dialogClassName={styles.modalDialogBottom}  // Apply the modal positioning class here
      >
        <Modal.Header closeButton className={styles.modalHeaderClose}> {/* Optional close button styling */}
          <Modal.Title style={{ color: 'black' }}>Comments</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}> {/* Apply modal body scroll */}
          <CommentSection selectedPostId={selectedPostId} userId={userId} />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SocialFeed;