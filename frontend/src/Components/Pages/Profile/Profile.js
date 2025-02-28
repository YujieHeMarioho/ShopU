import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Button, InputGroup, Form, Tab, Tabs, Modal } from 'react-bootstrap';
import { FaEnvelope, FaUser, FaEdit, FaRegHeart, FaHeart, FaTrash } from 'react-icons/fa';
import './Profile.module.css'; // Optional: Custom CSS
import UserPreferences from './UserPreferences';
import styles from './Profile.module.css';
import communityStyles from '../Community/Community.module.css'
import {SocialCard} from '../../Common';
import {CardGrid} from '../../Common';
import leaveCommunity from '../Community/Community';
import { useParams } from 'react-router-dom';


const Profile = () => {
    const { userId } = useParams();
    const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
    const { name, picture, email, updated_at, created_at } = user;
    const isOwnProfile = !userId || userId === user.sub;
    const targetUserId = isOwnProfile ? user.sub : userId;
    const currUserId = isAuthenticated ? user?.sub : null;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: name || '',
        email: email || '',
        picture: ''
    });

    const [message, setMessage] = useState('');
    const [key, setKey] = useState('posts'); // Default active tab
    const [userPosts, setUserPosts] = useState([]); // Placeholder for posts
    const [userListings, setUserListings] = useState([]); // Placeholder for listings
    const [userStatistics, setUserStatistics] = useState({}); // Placeholder for statistics
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isGridLayout, setIsGridLayout] = useState(true); // State to toggle layout
    const [selectedCard, setSelectedCard] = useState(null);
    const [listings, setListings] = useState([]);
    const [createdCommunities, setCreatedCommunities] = useState([]);
    const [userData, setUserData] = useState([]);

    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [isLiked, setIsLiked] = useState({});
    const username = user.name;
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);


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

    const fetchComments = async (postId) => {
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/${postId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch comments");

            const data = await response.json();
            const initialLikesState = data.reduce((acc, comment) => {
                acc[comment.comment_id] = comment.isliked; // Set initial like status for each comment
                return acc;
            }, {});

            setComments((prev) => ({ ...prev, [postId]: data }));  // Store comments by postId
            setIsLiked(initialLikesState);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCommentLike = async (commentId, currentLikeStatus) => {
        try {
            // Optimistically update UI by toggling the like status and adjusting the like count
            setIsLiked((prev) => ({
                ...prev,
                [commentId]: !currentLikeStatus, // Toggle like status
            }));

            setComments((prevComments) => {
                const updatedComments = { ...prevComments };
                const updatedPostComments = updatedComments[selectedPostId].map((comment) => {
                    if (comment.comment_id === commentId) {
                        return {
                            ...comment,
                            like_count: currentLikeStatus
                                ? comment.like_count - 1 // Decrease like count if already liked
                                : comment.like_count + 1, // Increase like count if not liked
                        };
                    }
                    return comment;
                });
                updatedComments[selectedPostId] = updatedPostComments;
                return updatedComments;
            });

            // Send the like/unlike request to the backend
            const token = await getAccessTokenSilently();
            const method = currentLikeStatus ? 'DELETE' : 'POST'; // Use DELETE if already liked, POST if not liked

            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/${commentId}/like`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to update like status');

            // Optionally, if needed, fetch the updated like count from the backend and update the state
            const updatedCommentData = await response.json();
            setComments((prevComments) => {
                const updatedComments = { ...prevComments };
                const updatedPostComments = updatedComments[selectedPostId].map((comment) => {
                    if (comment.comment_id === commentId) {
                        return {
                            ...comment,
                            like_count: updatedCommentData.like_count || comment.like_count, // Update like count if returned from backend
                        };
                    }
                    return comment;
                });
                updatedComments[selectedPostId] = updatedPostComments;
                return updatedComments;
            });

        } catch (error) {
            console.error("Error updating like status:", error);

            // Revert optimistic UI changes if the request fails
            setIsLiked((prev) => ({
                ...prev,
                [commentId]: currentLikeStatus,  // Revert the like status
            }));

            setComments((prevComments) => {
                const updatedComments = { ...prevComments };
                const updatedPostComments = updatedComments[selectedPostId].map((comment) => {
                    if (comment.comment_id === commentId) {
                        return {
                            ...comment,
                            like_count: currentLikeStatus
                                ? comment.like_count + 1
                                : comment.like_count - 1, // Revert like count
                        };
                    }
                    return comment;
                });
                updatedComments[selectedPostId] = updatedPostComments;
                return updatedComments;
            });
        }
    };


    const handleDeleteComment = async (commentId) => {
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to delete comment");

            // Remove the deleted comment from the local state (optimistic update)
            setComments((prevComments) => {
                const updatedComments = { ...prevComments };
                const updatedPostComments = updatedComments[selectedPostId].filter(
                    (comment) => comment.comment_id !== commentId
                );
                updatedComments[selectedPostId] = updatedPostComments;
                return updatedComments;
            });
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };
    const [newProfilePicture, setNewProfilePicture] = useState(null);

    const handleCardClick = (post) => {
        console.log("Card clicked:", post);
        setSelectedCard(post);
    };

    const handleListingCardClick = (listing) => {
        if (listing.id) {
            const fullLink = `${window.location.origin}/marketplace?listingId=${listing.id}`;
            window.open(fullLink, '_blank');
        }
    };

    useEffect(() => {
        fetchUserInfo();

        // Fetch user posts, listings, and statistics here
        fetchUserPosts();
        fetchUserListings();
        fetchUserStatistics();
        fetchUserCommunities();
    }, [userId]);

    const reloadFeed = () => {
        fetchUserPosts();  // Call the fetchFeed function to reload posts
    };


    const fetchUserPosts = async () => {
        try {
            const token = await getAccessTokenSilently();

            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/user/${targetUserId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error(`Failed to fetch user posts: ${response.statusText}`);

            const rawUserPosts = await response.json();
            setUserPosts(rawUserPosts);
        } catch (error) {
            console.error('Error fetching user posts:', error);
            setError('Failed to load user posts. Please try again later.');
        } finally {
            setLoading(false);
        }
    };


    const fetchUserInfo = async () => {
        try {
            const token = await getAccessTokenSilently();
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/${targetUserId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });

            // Map the data to match the desired format
            const formattedData = {
                user_id: response.data.user_id,
                create_date: response.data.create_date,
                email: response.data.email,
                name: response.data.name,
                picture: response.data.picture
            };
            setUserData(formattedData);

            setFormData(formattedData);


        } catch (error) {
            console.error('Error user data:', error);
        }
    }

    const fetchUserListings = async () => {
        // Fetch listings logic (replace with your actual API)
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/user/${targetUserId}`, {
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

            setUserListings(formattedData);

        } catch (error) {
            console.error('Error fetching listings:', error);
        }
    };

    const fetchUserCommunities = async () => {
        try {
            const token = await getAccessTokenSilently();

            //get created communities
            const createdCommunityResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/communities/created/${targetUserId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });
            setCreatedCommunities(createdCommunityResponse.data);
        } catch (error) {
            console.error('Error fetching communities:', error);
        }
    }

    const fetchUserStatistics = async () => {
        try {
            const token = await getAccessTokenSilently();

            // Fetch post count
            const postResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/user/count/${targetUserId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!postResponse.ok) {
                throw new Error('Failed to fetch post count');
            }

            const postCount = await postResponse.json();

            // Fetch listing count
            const listingResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/user/count/${targetUserId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!listingResponse.ok) {
                throw new Error('Failed to fetch listing count');
            }

            const listingCount = await listingResponse.json();

            // Fetch friends count
            const friendsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/friends/count/${targetUserId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!friendsResponse.ok) {
                throw new Error('Failed to fetch friends count');
            }

            const friendsCount = await friendsResponse.json();

            // Combine all statistics
            setUserStatistics({
                posts: postCount.count,
                listings: listingCount.count,
                friends: friendsCount.count,
            });
        } catch (error) {
            console.error('Error fetching user statistics:', error);
            setError('Failed to load user statistics. Please try again later.');
        }
    };


    const handleInputChange = (e) => {
        const { name, type, files, value } = e.target;

        setFormData((prevState) => ({
            ...prevState,
            [name]: type === "file" ? files[0] : value, // Store the file object instead of value
        }));
    };

    // Save changes to the backend
    const handleSaveChanges = async () => {
        try {
            const token = await getAccessTokenSilently();
            let newPicture = null;

            if (newProfilePicture) {
                const newPictureForm = new FormData();
                newPictureForm.append('picture', newProfilePicture);

                const upload = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: newPictureForm,
                });

                newPicture = await upload.json();
            }

            const requestBody = {
                email: formData.email,
                name: formData.name,
            };

            if (newPicture && newPicture.fileKey) {
                requestBody.picture = newPicture.fileKey;
            }


            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to save changes');
            }
            setMessage('Profile updated successfully!');
            window.location.reload();
        } catch (error) {
            console.error('Error saving user:', error);
            setMessage('Error saving profile: ' + error.message);
        }
    };

    const handleSaveClick = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmSave = () => {
        setShowConfirmModal(false);
        handleSaveChanges();
    };


    return (
        <Container className="my-5">
            <Card className="shadow-sm profile-card mb-4">
                <Card.Header className="profile-header">
                    {isOwnProfile && (
                        <h3 className="mb-0">Profile</h3>
                    )}

                </Card.Header>
                <Card.Body>
                    <Row className="align-items-center">
                        {/* Profile Picture */}
                        <Col md={3} className="text-center mb-4 mb-md-0">
                            <img
                                src={formData.picture}
                                alt="Profile"
                                className="rounded-circle img-fluid profile-picture"
                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                            />
                        </Col>

                        <Col md={9}>
                            {/* Name Input */}
                            <InputGroup className="mb-3">
                                <InputGroup.Text id="name">Name</InputGroup.Text>
                                <Form.Control
                                    placeholder="Name"
                                    aria-label="Name"
                                    aria-describedby="Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    readOnly={!isOwnProfile}
                                    className={`${!isOwnProfile ? styles.readOnlyInput : ''}`}
                                />
                            </InputGroup>

                            <InputGroup className="mb-3">
                                <InputGroup.Text id="email">Email</InputGroup.Text>
                                <Form.Control
                                    placeholder="Email"
                                    aria-label="Email"
                                    aria-describedby="Email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    readOnly={!isOwnProfile}
                                    className={`${!isOwnProfile ? styles.readOnlyInput : ''}`}
                                />
                            </InputGroup>

                            {isOwnProfile && (
                                <InputGroup className={`mb-3 ${styles.profilePictureGroup}`}>
                                    <InputGroup.Text id="picture" className={styles.profilePictureLabel}>Upload Profile
                                        Picture</InputGroup.Text>
                                    <div className={styles.profilePictureInputWrapper}>
                                        <input
                                            type="file"
                                            accept="image/jpeg, image/png, image/jpg, image/gif"
                                            onChange={(e) => setNewProfilePicture(e.target.files[0])}
                                            className={`form-control ${styles.profilePictureInput}`}
                                        />
                                    </div>
                                </InputGroup>
                            )}
                            {isOwnProfile && (
                                <>
                                    <Button variant="outline-primary" className="mt-3" onClick={handleSaveClick}>
                                        <FaEdit className="me-2" />
                                        Save Changes
                                    </Button>

                                    <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                                        <Modal.Header closeButton>
                                            <Modal.Title className={styles.saveChangesTextModal}>Confirm Save Changes</Modal.Title>
                                        </Modal.Header>
                                        <Modal.Body className={styles.saveChangesTextModal}>
                                            Saving changes will log you out. You'll need to log back in after the changes are saved. Do you want to continue?
                                        </Modal.Body>
                                        <Modal.Footer>
                                            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                                                Cancel
                                            </Button>
                                            <Button variant="primary" onClick={handleConfirmSave}>
                                                Save and Log Out
                                            </Button>
                                        </Modal.Footer>
                                    </Modal>
                                </>
                            )}

                            {/* Feedback Message */}
                            {message && (
                                <p className={`mt-3 ${message.includes('Error') ? 'text-danger' : 'text-success'}`}>
                                    {message}
                                </p>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
                <Card.Footer className="text-muted text-end">
                    Member since: {new Date(userData.create_date).toLocaleDateString()}
                </Card.Footer>
            </Card>

            {/* Tabs Section */}
            <Tabs activeKey={key} onSelect={(k) => setKey(k)} id="profile-tabs" className="mb-3">
                <Tab eventKey="posts" title="Posts">
                    <div className={`${styles.feedContainer} ${isGridLayout ? styles.gridView : styles.scrollView}`}>
                        {userPosts.length === 0 ? (
                            <p>No posts available.</p>
                        ) : (
                            userPosts.map((post) => (
                                <div key={post.post_id} className={styles.gridItem}
                                    onClick={() => handleCardClick(post)}>
                                    <SocialCard
                                        post_id={post.post_id}                // Directly passing post_id
                                        image={post.image}                 // Passing image URL
                                        title={post.title}                     // Passing title
                                        description={post.content}             // Passing content as description
                                        profilePic={post.profile}      // Passing profile picture URL
                                        author={post.author}                   // Passing author name
                                        authorId={post.author_id}              // Passing author ID
                                        initialLikes={post.likes_count}        // Mapping likes_count to initialLikes
                                        initialShares={post.shares}            // Mapping shares to initialShares
                                        isLikedAlready={post.isliked}                 // Check if post already liked by user
                                        tags={post.tags}                       // Passing tags
                                        listingId={post.listing_id}                       // Passing link
                                        onShowComments={() => handleShowComments(post.post_id)} // Handling show post comments
                                        reloadFeed={reloadFeed}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </Tab>

                <Tab eventKey="listings" title="Listings">
                    <div className={styles.cardGridContainer}>
                        <CardGrid
                            listings={userListings} // Pass the listings here
                            className={styles.cardGrid}
                            openListingDetails={handleListingCardClick} // Pass the card click handler here
                        />
                    </div>
                </Tab>
                <Tab eventKey="communities" title="Communities">
                    <p className='section-title'>Your Created Communities</p>
                    <div className="your-community-grid">
                        {createdCommunities.length === 0 ? (
                            <p>You haven't created any communities.</p>
                        ) : (
                            createdCommunities.map((community) => (
                                <div key={community.community_id} className={communityStyles.yourCommunityCard} onClick={(e) => handleCardClick(community.community_id, e)}>
                                    <img
                                        src={community.imageUrl}
                                        alt={community.community_id}
                                        className={communityStyles.communityImage}
                                    />
                                    <div className={communityStyles.communityInfo}>
                                        <h3>{community.name || `Community ${community.community_id}`}</h3>
                                        <p>{community.description}</p>
                                        {/*<p>Joined At: {new Date(community.joined_at).toLocaleString()}</p>*/}
                                    </div>
                                    {isOwnProfile &&(<button className={communityStyles.leaveButton} onClick={() => leaveCommunity(community.community_id)}>
                                        Leave {/*FIXME: add delete community ability*/}
                                    </button>)}
                                    
                                </div>
                            ))
                        )}
                    </div>
                </Tab>
                <Tab eventKey="statistics" title="Statistics">
                    <Card className="profile-tab-statistics mb-3">
                        <Card.Body>
                            <h5>User Statistics</h5>
                            <ul>
                                <li>Posts: {userStatistics.posts}</li>
                                <li>Listings: {userStatistics.listings}</li>
                                <li>Followers: {userStatistics.friends}</li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Tab>
                {isOwnProfile && (
                    <Tab eventKey="preferences" title="User Preferences">
                        <UserPreferences />
                    </Tab>
                )}
            </Tabs>


            {/* JSON Section */}
            {/*<Card className="shadow-sm">
          <Card.Header className="bg-secondary text-white">
            <h4 className="mb-0">User Information</h4>
          </Card.Header>
          <Card.Body className="bg-light">
            <pre
              style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '14px',
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(user, null, 2)}
            </pre>
          </Card.Body>
        </Card>
        */}
            {/* Comments Modal */}
            <Modal show={showComments} onHide={handleCloseComments} animation={true} className="bottom-modal"
                dialogClassName="modal-dialog-bottom">
                <Modal.Header closeButton>
                    <Modal.Title style={{ color: 'black' }}>Comments</Modal.Title>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    <div className="space-y-2">
                        {(comments[selectedPostId] || []).map((comment) => (
                            <div key={comment.comment_id} className={styles.commentContainer}>
                                {/* Comment text container */}
                                <div className={styles.commentText}>
                                    <strong>{comment.name}:</strong> {comment.text}

                                    {/* Like button and count */}
                                    <div className={styles.likeContainer}>
                                        <Button
                                            variant="link"
                                            onClick={() => handleCommentLike(comment.comment_id, isLiked[comment.comment_id])}
                                            style={{ color: isLiked[comment.comment_id] ? 'red' : 'gray' }}
                                        >
                                            {isLiked[comment.comment_id] ? <FaHeart /> : <FaRegHeart />}
                                        </Button>
                                        <span
                                            className={styles.likeCount}>{comment.like_count || 0}</span> {/* Display the number of likes */}
                                    </div>
                                </div>

                                {/* Delete button for the comment */}
                                {(comment.user_id === currUserId) && (
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
                        <Button className="ml-2" onClick={addComment} variant="primary">Post</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </Container>

    );
};

export default Profile;
