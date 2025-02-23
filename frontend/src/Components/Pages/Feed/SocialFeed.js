import React, { useState, useEffect } from 'react';
import styles from './SocialFeed.module.css';
import { Button } from 'react-bootstrap';
import { SocialCard } from '../../Common'; // Import the SocialCard component
import { useAuth0 } from '@auth0/auth0-react';
import { Route, Routes } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import {  FaHeart, FaRegHeart, FaTrash} from 'react-icons/fa';

const SocialFeed = () => {
    const [feed, setFeed] = useState([]);
    const [userFeed, setUserFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newPost, setNewPost] = useState({ title: '', content: '', imageUrl: '' });
    const [editPost, setEditPost] = useState(null);
    const [isPostLoading, setIsPostLoading] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [showModal, setShowModal] = useState(false); // State to toggle the modal
    const [selectedImage, setSelectedImage] = useState(null); // State for uploaded image
    const [isGridLayout, setIsGridLayout] = useState(true); // State to toggle layout
    const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const navigate = useNavigate();

    const userId = isAuthenticated ? user?.sub : null;

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [username, setUsername] = useState("User");

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
  
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ postId: selectedPostId, userId: user.sub, text: newComment })
      });
  
      if (!response.ok) throw new Error("Failed to post comment");
  
      const newCommentData = await response.json();
      setComments((prev) => ({
        ...prev,
        [selectedPostId]: [...(prev[selectedPostId] || []), newCommentData]
      }));
  
      setNewComment("");
    } catch (error) {
      console.error(error);
    }
  };

    const handleCardClick = (post) => {
        setSelectedCard(post);
      };
    
    const closeCardModal = () => {
        setSelectedCard(null);
    };

    const fetchFeed = async () => {
        try {
            const token = await getAccessTokenSilently();

            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
            if (!response.ok) throw new Error(`Failed to fetch feed: ${response.statusText}`);
            const rawFeed = await response.json();
            setFeed(rawFeed);
            console.log('Raw Feed:', rawFeed);
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


        // setIsPostLoading(true);
        // const uId = userId;
        // try {
        //     const response = await fetch('${process.env.REACT_APP_BACKEND_URL}/api/feed/create', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({ ...newPost, uId }),
        //     });
        //     if (!response.ok) throw new Error('Failed to create post');
        //     const createdPost = await response.json();
        //     setFeed((prev) => [createdPost, ...prev]);
        //     setUserFeed((prev) => [createdPost, ...prev]);
        //     setNewPost({ title: '', content: '', imageUrl: '' });   // TODO: Update method with fillable form
        // } catch (err) {
        //     console.error('Error creating post:', err);
        // } finally {
        //     setIsPostLoading(false);
        // }
    };

    const handlePostOperation = async (postId, method, updatedPost = null) => {
        setIsPostLoading(true);
        const url = `${process.env.REACT_APP_BACKEND_URL}/api/feed/${postId}`;
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: updatedPost ? JSON.stringify(updatedPost) : null,
        };

        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`Failed to ${method.toLowerCase()} post`);
            const updatedData = await response.json();
            setFeed((prev) => prev.map((post) => (post.post_id === postId ? updatedData : post)));
            setUserFeed((prev) => prev.map((post) => (post.post_id === postId ? updatedData : post)));
            setEditPost(null);
        } catch (err) {
            console.error('Error updating post:', err);
        } finally {
            setIsPostLoading(false);
        }
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

      const reloadFeed = () => {
        fetchFeed();  // Call the fetchFeed function to reload posts
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
        fetchFeed();
    }, []);  // Runs only once when the component mounts
    
    

    if (loading) return <p>Loading feed...</p>;
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
            <div className={`${styles.feedContainer} ${isGridLayout ? styles.gridView : styles.scrollView}`}>
                {feed.length === 0 ? (
                    <p>No posts available.</p>
                ) : (
                    feed.map((post) => (
                        <div key={post.post_id} className={styles.gridItem} onClick={isGridLayout ? () => handleCardClick(post) : undefined}>
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
                    ))
                )}
            </div>


    {/* Post Modal */}
    <Modal show={!!selectedCard} onHide={closeCardModal} centered>
        <Modal.Header closeButton>
        </Modal.Header>

        <Modal.Body
            style={{
                color: "#000000",
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
            }}
        >
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
