import React, { useState, useEffect } from 'react';
import styles from './SocialFeed.module.css';
import { Button } from 'react-bootstrap';
import { SocialCard } from '../../Common'; // Import the SocialCard component
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { FaHeart, FaRegHeart, FaTrash } from 'react-icons/fa';
import Masonry from 'react-masonry-css';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';

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

  // For Comments
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState({});
  const [likeCount, setLikeCount] = useState({});

  // For the user’s friend list (fetched once)
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  const userId = isAuthenticated ? user?.sub : null;
  const username = user?.name || 'Anonymous';

  // ------------------------------
  // 1) Fetch friend list ONCE here
  // ------------------------------
  useEffect(() => {
    if (!user) return;
    const fetchFriends = async () => {
      try {
        const token = await getAccessTokenSilently();

        // A) /api/friends => friend relationships
        const friendsResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/friends`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { user_id: user.sub },
          }
        );

        // B) For each friend, fetch user info from /api/user/:friend_id => name/picture
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

  // -----------------------------
  // 2) Fetch the feed
  // -----------------------------
  const fetchFeed = async (pageNumber) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed?page=${pageNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  // If you also want to fetch a user’s personal feed:
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

  // Initial load
  useEffect(() => {
    fetchFeed(page);
  }, [page]);

  // Infinite scroll logic
  useEffect(() => {
    if (inView && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [inView, hasMore, feed.length]);

  // Comments
  const handleShowComments = (post_id) => {
    setSelectedPostId(post_id);
    setShowComments(true);
    fetchComments(post_id);
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedPostId(null);
  };

  const fetchComments = async (postId) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch comments');

      const data = await response.json();

      // Build initial like states
      const initialLikesState = data.reduce((acc, comment) => {
        acc[comment.comment_id] = comment.isliked;
        return acc;
      }, {});

      const initialLikeCounts = data.reduce((acc, comment) => {
        acc[comment.comment_id] = comment.like_count;
        return acc;
      }, {});

      setComments((prev) => ({ ...prev, [postId]: data }));
      setIsLiked(initialLikesState);
      setLikeCount(initialLikeCounts);
    } catch (error) {
      console.error(error);
    }
  };

  // Add new comment
  const addComment = async () => {
    if (!newComment.trim()) return;
    const tempId = Date.now();

    // Optimistic UI
    const newCommentData = {
      id: tempId,
      user_id: user.sub,
      name: username,
      text: newComment,
      like_count: 0,
      isliked: false,
    };

    setComments((prev) => ({
      ...prev,
      [selectedPostId]: [...(prev[selectedPostId] || []), newCommentData],
    }));

    setLikeCount((prev) => ({ ...prev, [tempId]: 0 }));
    setIsLiked((prev) => ({ ...prev, [tempId]: false }));
    setNewComment('');

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: selectedPostId, userId: user.sub, text: newComment }),
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const postedCommentData = await response.json();
      // Merge the actual data from the response
      setComments((prev) => ({
        ...prev,
        [selectedPostId]: prev[selectedPostId].map((comment) =>
          comment.id === tempId ? { ...comment, ...postedCommentData } : comment
        ),
      }));

      setLikeCount((prev) => ({
        ...prev,
        [postedCommentData.comment_id]: postedCommentData.like_count ?? 0,
      }));
      setIsLiked((prev) => ({
        ...prev,
        [postedCommentData.comment_id]: postedCommentData.isliked ?? false,
      }));
    } catch (error) {
      console.error('Error posting comment:', error);
      // Roll back if error
      setComments((prev) => ({
        ...prev,
        [selectedPostId]: (prev[selectedPostId] || []).filter((c) => c.id !== tempId),
      }));
      setLikeCount((prev) => {
        const updated = { ...prev };
        delete updated[tempId];
        return updated;
      });
      setIsLiked((prev) => {
        const updated = { ...prev };
        delete updated[tempId];
        return updated;
      });
    }
  };

  // Like a comment
  const handleCommentLike = async (commentId, currentLikeStatus) => {
    try {
      // Optimistic toggle
      setIsLiked((prev) => ({ ...prev, [commentId]: !currentLikeStatus }));
      setLikeCount((prev) => ({
        ...prev,
        [commentId]: currentLikeStatus ? prev[commentId] - 1 : prev[commentId] + 1,
      }));

      setComments((prev) => {
        const updated = { ...prev };
        if (updated[selectedPostId]) {
          updated[selectedPostId] = updated[selectedPostId].map((c) =>
            c.comment_id === commentId
              ? {
                  ...c,
                  like_count: currentLikeStatus ? c.like_count - 1 : c.like_count + 1,
                }
              : c
          );
        }
        return updated;
      });

      // Send request
      const token = await getAccessTokenSilently();
      const method = currentLikeStatus ? 'DELETE' : 'POST';
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/${commentId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to update like status');

      const updatedCommentData = await response.json();
      // Optionally update local state with fresh like counts
      setLikeCount((prev) => ({
        ...prev,
        [commentId]: updatedCommentData.like_count ?? prev[commentId],
      }));
      // similarly update setComments if needed
    } catch (error) {
      console.error('Error updating like status:', error);
      // revert
      setIsLiked((prev) => ({ ...prev, [commentId]: currentLikeStatus }));
      setLikeCount((prev) => ({
        ...prev,
        [commentId]: currentLikeStatus ? prev[commentId] + 1 : prev[commentId] - 1,
      }));
      // revert comment array if needed
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete comment');

      // Remove from local
      setComments((prev) => {
        const updated = { ...prev };
        updated[selectedPostId] = updated[selectedPostId].filter((c) => c.comment_id !== commentId);
        return updated;
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Create new post
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
    setSelectedCard(post);
  };

  const closeCardModal = () => {
    setSelectedCard(null);
  };

  // ------------------------------------
  // RENDER
  // ------------------------------------
  if (loading && page === 1) return <p>Loading feed...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.socialFeedContainer}>
      <h2>Social Feed</h2>

      {/* Toggle Layout */}
      <div className={styles.layoutToggleButton}>
        <Button onClick={toggleLayout} variant="outline-primary">
          {isGridLayout ? 'Switch to Scrolling Layout' : 'Switch to Grid Layout'}
        </Button>
      </div>

      <Button onClick={createFeedPost} variant="outline-primary">
        Create new Post
      </Button>

      {/* The feed display */}
      <div className={styles.feedContainer}>
        {isGridLayout ? (
          <Masonry
            breakpointCols={{ default: 8, 2560: 6, 1920: 5, 1280: 3, 1024: 2, 768: 1 }}
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

                  // Pass friend info down
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

                  // Pass friend info down
                  allFriends={friends}
                  friendsLoading={friendsLoading}
                />
              </div>
            ))}
          </div>
        )}
        {loading && <p>Loading more posts...</p>}
      </div>

      {/* Post Modal (single card popup) */}
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

              // Pass friend info
              allFriends={friends}
              friendsLoading={friendsLoading}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal for Image Upload (create new post) */}
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
        className="bottom-modal"
        dialogClassName="modal-dialog-bottom"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ color: 'black' }}>Comments</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          <div className="space-y-2">
            {(comments[selectedPostId] || []).map((comment) => (
              <div key={comment.comment_id} className={styles.commentContainer}>
                <div className={styles.commentText}>
                  <strong>{comment.name}:</strong> {comment.text}
                  <div className={styles.likeContainer}>
                    <Button
                      variant="link"
                      onClick={() => handleCommentLike(comment.comment_id, isLiked[comment.comment_id])}
                      style={{ color: isLiked[comment.comment_id] ? 'red' : 'gray' }}
                    >
                      {isLiked[comment.comment_id] ? <FaHeart /> : <FaRegHeart />}
                    </Button>
                    <span className={styles.likeCount}>{likeCount[comment.comment_id] || 0}</span>
                  </div>
                </div>
                {comment.user_id === userId && (
                  <Button
                    variant="link"
                    onClick={() => handleDeleteComment(comment.comment_id)}
                    className={styles.deleteButton}
                  >
                    <FaTrash />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* New comment input */}
          <div className="mt-4 d-flex">
            <input
              type="text"
              className="form-control"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
            />
            <Button className="ml-2" onClick={addComment} variant="primary">
              Post
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SocialFeed;
