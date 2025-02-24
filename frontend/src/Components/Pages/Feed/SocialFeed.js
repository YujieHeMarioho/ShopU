import React, { useState, useEffect } from 'react';
import styles from './SocialFeed.module.css';
import { Button } from 'react-bootstrap';
import { SocialCard } from '../../Common'; // Import the SocialCard component
import { useAuth0 } from '@auth0/auth0-react';
import { Route, Routes } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import {  FaHeart, FaRegHeart, FaTrash} from 'react-icons/fa';
import Masonry from 'react-masonry-css';
import { useInView } from 'react-intersection-observer';

const SocialFeed = () => {
    const [feed, setFeed] = useState([]);
    const [userFeed, setUserFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [showModal, setShowModal] = useState(false); // State to toggle the modal
    const [selectedImage, setSelectedImage] = useState(null); // State for uploaded image
    const [isGridLayout, setIsGridLayout] = useState(true); // State to toggle layout
    const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
    const [isLiked, setIsLiked] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const { ref, inView } = useInView({ threshold: 0.5 });
    const navigate = useNavigate();

    const userId = isAuthenticated ? user?.sub : null;

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const username = user.name;

  const handleShowComments = (post_id) => {
    setSelectedPostId(post_id);
    setShowComments(true);
    fetchComments(post_id);
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedPostId(null);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    // Optimistically add the new comment to the UI
    const newCommentData = {
        id: Date.now(),  // Temporary ID, will be replaced by the actual ID from the backend if needed
        user_id: user.sub,
        name: username,  // Assuming `username` is correctly set
        text: newComment,
        likes: 0,  // Assuming likes is 0 initially
    };

    setComments((prev) => ({
        ...prev,
        [selectedPostId]: [
            ...(prev[selectedPostId] || []), 
            newCommentData
        ],
    }));

    setNewComment("");  // Reset the new comment input

    try {
        const token = await getAccessTokenSilently();
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ postId: selectedPostId, userId: user.sub, text: newComment }),
        });

        if (!response.ok) throw new Error("Failed to post comment");

        const postedCommentData = await response.json();
        
        setComments((prev) => ({
            ...prev,
            [selectedPostId]: prev[selectedPostId].map(comment =>
                comment.id === newCommentData.id ? { ...comment, ...postedCommentData } : comment
            ),
        }));

    } catch (error) {
        console.error("Error posting comment:", error);
    }
};

    const handleCardClick = (post) => {
        setSelectedCard(post);
      };
    
    const closeCardModal = () => {
        setSelectedCard(null);
    };

    const fetchFeed = async (pageNumber) => {
        try {
            const token = await getAccessTokenSilently();

            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed?page=${pageNumber}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
            if (!response.ok) throw new Error(`Failed to fetch feed: ${response.statusText}`);
            const rawFeed = await response.json();
            if (rawFeed.length === 0) setHasMore(false);
            setFeed(prevFeed => {
              const existingPostIds = new Set(prevFeed.map(post => post.post_id));
              const newPosts = rawFeed.filter(post => !existingPostIds.has(post.post_id));
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
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error(`Failed to fetch user feed: ${response.statusText}`);
            const rawUserFeed = await response.json();
            setUserFeed(rawUserFeed);
        } catch (err) {
            console.error('Error fetching user feed:', err);
        }
    };

    const fetchComments = async (postId) => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/${postId}`);
          if (!response.ok) throw new Error("Failed to fetch comments");
      
          const data = await response.json();
          setComments((prev) => ({ ...prev, [postId]: data }));  // Store comments by postId
        } catch (error) {
          console.error(error);
        }
      };
    

    const createFeedPost = async () => {
        handleCreateNewPost();
    };

    const toggleLayout = () => {
        setIsGridLayout((prev) => !prev); // Toggle between grid and scroll view
    };

    const handleCreateNewPost = () => {
        setShowModal(true); // Show the modal when the button is clicked
      };
    
      const handleCloseModal = () => {
        setShowModal(false);
        setSelectedImage(null);
      };
    
      const proceedToEditImage = () => {
        setShowModal(false);
        navigate("/edit-image", { state: { image: selectedImage } });
      };
    
      const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setSelectedImage(reader.result); // Set image as a base64 data URL
          };
          reader.readAsDataURL(file);
        }
      };

      const reloadFeed = async (page) => {
        fetchFeed(page);  // Call the fetchFeed function to reload posts
    };

    const handleCommentLike = async (commentId) => {
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/${commentId}/like`, {
              method: 'POST', // Or DELETE if unliking
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
        
            if (!response.ok) throw new Error('Failed to update like status');
          } catch (error) {
            console.error(error);
          }
      };

      const handleDeleteComment = async (commentId) => {
        try {
          const token = await getAccessTokenSilently();
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
    
          if (!response.ok) throw new Error("Failed to delete comment");
    
          // Remove the deleted comment from the list
          setComments(prev => prev.filter(comment => comment.id !== commentId));
        } catch (error) {
          console.error('Error deleting comment:', error);
        }
      };

    // useEffect(() => {
    //     if (userId) {
    //         fetchUserFeed();  // Fetch user feed if user is logged in
    //     } else {
    //         fetchFeed();      // Fetch general feed if user is not logged in
    //     }
    // }, [userId]);
    useEffect(() => {
      fetchFeed(page);
    }, [page]); // Runs only once when the component mounts

    useEffect(() => {
      if (inView && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, [inView, hasMore, feed.length]);
    
    

    if (loading && page === 1) return <p>Loading feed...</p>;
    if (error) return <p>{error}</p>;

    return (
<div className={styles.socialFeedContainer}>
    <h2>Social Feed</h2>

    {/* Toggle Layout Button */}
    <div className={styles.layoutToggleButton}>
        <Button onClick={toggleLayout} variant="outline-primary">
            {isGridLayout ? 'Switch to Scrolling Layout' : 'Switch to Grid Layout'}
        </Button>
    </div>

    <Button onClick={createFeedPost} variant="outline-primary"> Create new Post</Button>

            {/* Display the feed */}
            <div className={styles.feedContainer}>

            {/* Masonry Layout */}
            {isGridLayout ? (
                <Masonry
                    breakpointCols={{ default: 5, 1024: 2, 768: 1 }}
                    className={styles.masonryGrid}
                    columnClassName={styles.masonryColumn}
                >
                    {feed.map((post, index) => (
                        <div key={post.post_id} className={styles.gridItem} ref={index === feed.length - 1 ? ref : null} onClick={() => handleCardClick(post)}>
                            <SocialCard
                                post_id={post.post_id}                // Directly passing post_id
                                image={post.image}                 // Passing image URL
                                title={post.title}                     // Passing title
                                description={post.content}             // Passing content as description
                                profilePic={post.profile_pic_url}      // Passing profile picture URL
                                author={post.author}                   // Passing author name
                                authorId={post.author_id}              // Passing author ID
                                initialLikes={post.likes_count}        // Mapping likes_count to initialLikes
                                initialShares={post.shares}            // Mapping shares to initialShares
                                isLikedAlready={post.isliked}                 // Check if post already liked by user
                                tags={post.tags}                       // Passing tags
                                listingId={post.listing_id}                       // Passing link
                                onShowComments={()=>handleShowComments(post.post_id)} // Handling show post comments
                                reloadFeed={reloadFeed}
                            />
                        </div>
                    ))}
                </Masonry>
            ) : (
                // Scroll Layout (Stacked View)
                <div className={styles.scrollView}>
                    {feed.map((post, index) => (
                        <div key={post.post_id} className={styles.scrollItem} ref={index === feed.length - 1 ? ref : null} onClick={() => handleCardClick(post)}>
                            <SocialCard
                                post_id={post.post_id}                // Directly passing post_id
                                image={post.image}                 // Passing image URL
                                title={post.title}                     // Passing title
                                description={post.content}             // Passing content as description
                                profilePic={post.profile_pic_url}      // Passing profile picture URL
                                author={post.author}                   // Passing author name
                                authorId={post.author_id}              // Passing author ID
                                initialLikes={post.likes_count}        // Mapping likes_count to initialLikes
                                initialShares={post.shares}            // Mapping shares to initialShares
                                isLikedAlready={post.isliked}                 // Check if post already liked by user
                                tags={post.tags}                       // Passing tags
                                listingId={post.listing_id}                       // Passing link
                                onShowComments={()=>handleShowComments(post.post_id)} // Handling show post comments
                                reloadFeed={reloadFeed}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Loading Indicator */}
            {loading && <p>Loading more posts...</p>}
        </div>
    {/* Post Modal */}
    <Modal show={!!selectedCard} onHide={closeCardModal} centered>
        <Modal.Header closeButton>
        </Modal.Header>

        <Modal.Body className={styles.modalBody}>
            {selectedCard && (
                <SocialCard
                    post_id={selectedCard.post_id}
                    image={selectedCard.image}
                    title={selectedCard.title}
                    description={selectedCard.content}
                    profilePic={selectedCard.profile_pic_url}
                    author={selectedCard.author}
                    authorId={selectedCard.author_id}
                    initialLikes={selectedCard.likes_count}
                    initialShares={selectedCard.shares}
                    isLikedAlready={selectedCard.isliked}
                    tags={selectedCard.tags}
                    listingId={selectedCard.listing_id}
                    onShowComments={()=>handleShowComments(selectedCard.post_id)} // Handling show post comments
                    reloadFeed={reloadFeed}
                />
            )}
        </Modal.Body>
    </Modal>

            {/* Modal for Image Upload */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ color: "#000000" }}>New Post</Modal.Title>
                </Modal.Header>
                <Modal.Body 
                    style={{ 
                    color: "#000000", 
                    textAlign: "center", 
                    display: "flex", 
                    justifyContent: "center", 
                    flexDirection: "column" 
                    }}
                >
                    <p style={{ marginBottom: "20px" }}>Upload an Image</p>
                    <div style={{ marginBottom: "20px" }}>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        style={{ display: "inline-block" }} 
                    />
                    </div>
                    {selectedImage && (
                    <div 
                        style={{
                        marginTop: "20px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "visible", // Allow the image to expand without clipping
                        }}
                    >
                        <img
                        src={selectedImage}
                        alt="Preview"
                        style={{
                            maxWidth: "100%", // Ensures it scales down to fit the width of the modal
                            maxHeight: "90vh", // Ensures the image doesn't overflow the height of the viewport
                            width: "auto", // Maintain aspect ratio
                            height: "auto", // Maintain aspect ratio
                            borderRadius: "12px",
                            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                        }}
                        />
                    </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                    Cancel
                    </Button>
                    <Button
                    variant="primary"
                    onClick={proceedToEditImage}
                    disabled={!selectedImage} // Disable if no image is uploaded
                    >
                    Next
                    </Button>
                </Modal.Footer>
                </Modal>

         {/* Comments Modal */}
         <Modal show={showComments} onHide={handleCloseComments} animation={true} className="bottom-modal" dialogClassName="modal-dialog-bottom">
      <Modal.Header closeButton>
        <Modal.Title style={{ color: 'black' }}>Comments</Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        <div className="space-y-2">
          {(comments[selectedPostId] || []).map((comment, index) => (
            <div key={index} className={styles.commentContainer}>
              {/* Comment text container */}
              <div className={styles.commentText}>
                <strong>{comment.name}:</strong> {comment.text}

                {/* Like button and count */}
                <div className={styles.likeContainer}>
                  <Button
                    variant="link"
                    onClick={() => handleCommentLike(comment.id)} // Pass comment id to like/unlike
                    className={isLiked ? styles.liked : ''}
                  >
                    {isLiked ? <FaHeart /> : <FaRegHeart />}
                  </Button>
                  <span className={styles.likeCount}>{comment.likes || 0}</span> {/* Display the number of likes */}
                </div>
              </div>
              {/* Delete button for the comment */}
              {(comment.user_id === userId) && (
                  <Button
                    variant="link"
                    onClick={() => handleDeleteComment(comment.id)}
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
          <Button className="ml-2" onClick={addComment} variant="primary">Post</Button>
        </div>
      </Modal.Body>
    </Modal>



        </div>
    );
};

export default SocialFeed;
