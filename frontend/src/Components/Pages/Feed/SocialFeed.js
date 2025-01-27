import React, { useState, useEffect } from 'react';
import styles from './SocialFeed.module.css';
import { Button } from 'react-bootstrap';
import { SocialCard } from '../../Common'; // Import the SocialCard component
import { useAuth0 } from '@auth0/auth0-react';
import { Route, Routes } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';

const SocialFeed = () => {
    const [feed, setFeed] = useState([]);
    const [userFeed, setUserFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newPost, setNewPost] = useState({ title: '', content: '', imageUrl: '' });
    const [editPost, setEditPost] = useState(null);
    const [isPostLoading, setIsPostLoading] = useState(false);
    const [showModal, setShowModal] = useState(false); // State to toggle the modal
    const [selectedImage, setSelectedImage] = useState(null); // State for uploaded image
    const [isGridLayout, setIsGridLayout] = useState(true); // State to toggle layout
    const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
    const navigate = useNavigate();

    const userId = isAuthenticated ? user?.sub : null;

    const fetchFeed = async () => {
        try {
            const token = await getAccessTokenSilently();

            const response = await fetch('http://localhost:8080/api/feed', {
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
            const response = await fetch(`http://localhost:8080/api/feed/user/${userId}`);
            if (!response.ok) throw new Error(`Failed to fetch user feed: ${response.statusText}`);
            const rawUserFeed = await response.json();
            setUserFeed(rawUserFeed);
        } catch (err) {
            console.error('Error fetching user feed:', err);
        }
    };

    const createFeedPost = async () => {
        handleCreateNewPost();


        // setIsPostLoading(true);
        // const uId = userId;
        // try {
        //     const response = await fetch('http://localhost:8080/api/feed/create', {
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
        const url = `http://localhost:8080/api/feed/${postId}`;
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

    const handleLike = async (postId, currentLikes, isLiked) => {
        // Optimistic UI update for likes count
        setFeed((prev) =>
            prev.map((post) =>
                post.post_id === postId
                    ? { ...post, likes: isLiked ? currentLikes + 1 : currentLikes - 1, is_liked: !isLiked }
                    : post
            )
        );

        try {
            const response = await fetch(`http://localhost:8080/api/feed/like/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_liked: !isLiked }),
            });
            if (!response.ok) throw new Error('Failed to like post');
            const updatedData = await response.json();
            setFeed((prev) =>
                prev.map((post) => (post.post_id === postId ? updatedData : post))
            );
        } catch (err) {
            console.error('Error liking post:', err);
        }
    };

    const shareFeedPost = async (postId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/feed/share/${postId}`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to share post');
            alert('Post shared successfully!');
        } catch (err) {
            console.error('Error sharing post:', err);
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

    // useEffect(() => {
    //     if (userId) {
    //         fetchUserFeed();  // Fetch user feed if user is logged in
    //     } else {
    //         fetchFeed();      // Fetch general feed if user is not logged in
    //     }
    // }, [userId]);
    useEffect(()=>{
        fetchFeed();
    })
    

    if (loading) return <p>Loading feed...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className={styles.socialFeedContainer}>
            <h2>Social Feed</h2>
            
            {/* Toggle Layout Button */}
            <div className={styles.layoutToggleButton}>
                <Button
                    onClick={toggleLayout}
                    variant="outline-primary"
                >
                    {isGridLayout ? 'Switch to Scrolling Layout' : 'Switch to Grid Layout'}
                </Button>
            </div>

            <Button onClick={createFeedPost} variant="outline-primary"> Create new Post

            </Button>

            {/* Display the feed */}
            <div className={`${styles.feedContainer} ${isGridLayout ? styles.gridView : styles.scrollView}`}>
                {feed.length === 0 ? (
                    <p>No posts available.</p>
                ) : (
                    feed.map((post) => (
                        <div key={post.post_id} className={styles.gridItem}> 
                            <SocialCard
                                post_id={post.post_id}                // Directly passing post_id
                                image={post.image_url}                 // Passing image URL
                                title={post.title}                     // Passing title
                                description={post.content}             // Passing content as description
                                profilePic={post.profile_pic_url}      // Passing profile picture URL
                                author={post.author}                   // Passing author name
                                initialLikes={post.likes_count}        // Mapping likes_count to initialLikes
                                initialShares={post.shares}            // Mapping shares to initialShares
                                isLikedAlready={post.isliked}                 // Check if post already liked by user
                                tags={post.tags}                       // Passing tags
                                onLike={() => handleLike(post.post_id, post.likes_count, post.is_liked)} // Handling like action
                                onShare={() => shareFeedPost(post.post_id)}  // Handling share action
                            />
                        </div>
                    ))
                )}
            </div>
            {/* Modal for Image Upload */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                <Modal.Title>Upload an Image</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {selectedImage && (
                    <div style={{ marginTop: "20px", textAlign: "center" }}>
                    <img
                        src={selectedImage}
                        alt="Preview"
                        style={{
                        maxWidth: "100%",
                        maxHeight: "300px",
                        borderRadius: "8px",
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
        </div>
    );
};

export default SocialFeed;
