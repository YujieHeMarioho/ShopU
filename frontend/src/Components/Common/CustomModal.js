import React, { useState, useEffect } from "react";
import styles from "./CustomModal.module.css";
import { useAuth0 } from '@auth0/auth0-react';
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import CommentSection from "./CommentSection";
import { FaThumbsUp, FaShare, FaHeart, FaRegHeart } from 'react-icons/fa';
import { Modal, Form } from "react-bootstrap";

export const CustomModal = ({ 
  image,
  video,
  title,
  description,
  tags = [],
  reloadFeed,
  show, onHide, centered, selectedCard, allFriends, friendsLoading = true, isFavoritedAlready }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [userData, setUserData] = useState(null);
  const authorId = selectedCard?.author_id;
  const post_id = selectedCard?.post_id;
  const [alertMessage, setAlertMessage] = useState(null);
  const [likes, setLikes] = useState(selectedCard?.likes_count || 0);
  const [shares, setShares] = useState(0);
  const [isLiked, setIsLiked] = useState(selectedCard?.isliked);
  const [isShared, setIsShared] = useState(false);
  const [isFavorited, setIsFavorited] = useState(isFavoritedAlready);

  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(selectedCard?.title);
  const [editedDescription, setEditedDescription] = useState(selectedCard?.content);
  const [editedTags, setEditedTags] = useState(selectedCard?.tags);
  const [editedImage, setEditedImage] = useState(selectedCard?.image);
  const [editedVideo, setEditedVideo] = useState(video);
  const [loading, setLoading] = useState(false);

  const [communities, setCommunities] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (selectedCard?.post_id) {
      fetchPostLikes(selectedCard?.post_id);
    }
  }, [selectedCard, likes, isLiked]);
  

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [show]);

  const fetchPostLikes = async (postId) => {
    if (!postId) return;
  
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/feed/${postId}/likes`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (!response.ok) {
        throw new Error(`Failed to fetch likes: ${response.statusText}`);
      }
  
      const data = await response.json();
  
      // Ensure likes is a number, not an object
      setLikes(data.likesCount ?? 0); // Just store the number of likes
      setIsLiked(data.isLiked ?? false); // Set the liked status
  
    } catch (error) {
      console.error("Error fetching post likes:", error);
    }
  };
  

  const fetchCommunities = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/communities`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        const data = await response.json();
        
        // Assuming response.data is an array of community objects with `id` and `name` properties
        setCommunities(data.map(community => ({
          id: community.community_id,
          name: community.name
        })));
      } else {
        throw new Error('Failed to fetch communities');
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
  
      if (!response.ok) throw new Error('Failed to fetch favorites');
  
      const data = await response.json();
  
      // Assuming the data returned contains all the post details.
      // Now check if the current post is favorited based on the returned data
      const isCurrentlyFavorited = data.some(fav => fav.post_id === post_id);
      
      setIsFavorited(isCurrentlyFavorited);  // Update the favorite status based on post_id
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  useEffect(() => {
    if (user && authorId) {
      const fetchUserInfo = async () => {
        try {
          const token = await getAccessTokenSilently();
          const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/${authorId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });
          setUserData(response.data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      fetchUserInfo();
      fetchCommunities();
      fetchFavorites();
    }
  }, [user, authorId, getAccessTokenSilently]);


  if (!show) return null;

  const isSocialCard = selectedCard && selectedCard.post_id;

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/${post_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editedTitle,
          description: editedDescription,
          tags: editedTags.split(',').map((t) => t.trim()),
          image: editedImage,
          video: editedVideo,
        }),
      });
      if (response.ok) {
        setIsEditing(false);
        reloadFeed();
      } else {
        console.error('Failed to update post:', await response.text());
      }
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (selectedPostId) => {
    if (!selectedPostId) return;
    try {
      const token = await getAccessTokenSilently();
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/${selectedPostId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete post');
      reloadFeed();
      setIsEditing(false);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShareModal = () => {
    setSelectedOption('');
    setSelectedFriend(null);
    setSelectedCommunity(null);
    setShowShareModal(false);
  };

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    const newLikeStatus = !isLiked;
    setIsLiked(newLikeStatus);
    try {
      const token = await getAccessTokenSilently();
      const response = await likeAPICall(selectedCard?.post_id, newLikeStatus, token, user.sub);
      if (response.success) {
        setLikes(response.likeCount);
      }
    } catch (error) {
      setAlertMessage('Failed to update like. Please try again later.');
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const handleShareClick = async (e) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleConfirmShare = async () => {
    try {
      setIsShared(true);
      setShares(prev => prev + 1);
      setShowShareModal(false);
  
      const token = await getAccessTokenSilently();
      const postPath = `/feed?post_id=${post_id}`;
  
      if (selectedOption === 'friend' && selectedFriend) {
        const friend = allFriends.find(f => f.friend_id === selectedFriend);
        if (!friend) throw new Error('Friend not found');
  
        const conversationsResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/conversations/${user.sub}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        let conversation = conversationsResponse.data.find(
          convo => convo.user1_id === selectedFriend || convo.user2_id === selectedFriend
        );
  
        if (!conversation) {
          const newConversationResponse = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/conversations`,
            { user1_id: user.sub, user2_id: selectedFriend },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          conversation = newConversationResponse.data;
        }
  
        const conversationId = conversation.conversation_id;
        const messageContent = `Check out this post: ${postPath}`;
        await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/messages/${conversationId}/messages`,
          { senderId: user.sub, content: messageContent },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        setAlertMessage('Post shared successfully!');
        setTimeout(() => setAlertMessage(null), 3000);
      } else if (selectedOption === 'community' && selectedCommunity) {
        // Find the associated community_id based on the community name
        const token = await getAccessTokenSilently();
        const postPath = `/feed?post_id=${post_id}`;
  
        // Now send the community_id along with the post_id and user_id to the backend
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/communities/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            post_id,
            community_id: selectedCommunity,  // Use the found community_id
            user_id: user.sub,
          }),
        });
  
        if (!response.ok) throw new Error('Failed to share post to community');
  
        setAlertMessage('Post shared to community successfully!');
        setTimeout(() => setAlertMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      setIsShared(false);
      setShares(prev => prev - 1);
      setAlertMessage('Failed to share post. Please try again.');
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const likeAPICall = async (post_id, isLiked, token, userId) => {
    try {
      const URL = `${process.env.REACT_APP_BACKEND_URL}/api/feed/${post_id}/like`;
      const method = isLiked ? 'POST' : 'POST';
      const response = await fetch(URL, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Something went wrong');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    try {
      const token = await getAccessTokenSilently();
      const newFavoriteStatus = !isFavorited;
      const success = await favoriteAPICall(post_id, newFavoriteStatus, token);
  
      if (success) {
        setIsFavorited(newFavoriteStatus);
        setAlertMessage(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
        setTimeout(() => setAlertMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      setAlertMessage('Failed to update favorite. Please try again later.');
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const favoriteAPICall = async (post_id, isFavoriting, token) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/favorites/${post_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: isFavoriting ? 'add' : 'remove' }), // Send action to backend
      });
  
      if (response.ok) return true;
      
      const errorData = await response.json();
      throw new Error(errorData.error || 'Something went wrong');
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };


  const handleMessage = async () => {
    if (!authorId) {
      alert('User information is not available.');
      return;
    }
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/conversations`,
        {
          user1_id: user.sub,
          user2_id: authorId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat/${response.data.conversation_id}`);
    } catch (error) {
      console.error('Error starting conversation with User:', error.response ? error.response.data : error.message);
      alert('Unable to start conversation with User. Please try again.');
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onHide}>
      <div className={`${styles.modalContent}`} onClick={(e) => e.stopPropagation()}>
        <CustomModal.Header closeButton onHide={onHide} />
        <CustomModal.Body>
          {isSocialCard ? (
            <div className={styles.modalContentWrapper}>
              {/* Social Card Section (Scrollable) */}
              <div className={styles.socialCardSection}>
                <div centered>
                  <img src={selectedCard.image} alt={selectedCard.title} className={styles.modalCardImage} />
                  <h3>{selectedCard.title}</h3>
                  <p>{selectedCard.content}</p>
                </div>
                <div className={styles.actionButtons}>
                  <Button variant="light" onClick={handleLikeClick} className={styles.button} style={{ color: isLiked ? 'blue' : 'gray' }}>
                    <FaThumbsUp style={{ marginRight: '5px' }} />
                    {likes} Likes
                  </Button>
                  {user?.sub !== authorId && (
                    <Button variant="light" onClick={handleFavoriteClick} className={styles.button} style={{ color: isFavorited ? 'red' : 'gray' }}>
                      {isFavorited ? <FaHeart /> : <FaRegHeart />} {isFavorited ? "Favorited" : "Favorite"}
                    </Button>
                  )}
                  <Button variant="light" onClick={handleShareClick} className={styles.button} style={{ color: isShared ? 'green' : 'gray' }}>
                    <FaShare style={{ marginRight: '5px' }} />
                    {shares} Shares
                  </Button>
                  {user?.sub === authorId && (
                    <Button variant="outline-warning" size="sm" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                      ✏️ Edit
                    </Button>
                  )}
                </div>
                <div className={styles.CommentSection}>
                  <CommentSection selectedPostId={selectedCard.post_id} userId={user?.sub} />
                </div>
              </div>
              
              {/* User Info Section (Fixed at the top) */}
              <div className={styles.userInfoSection}>
                {userData ? (
                  <div className={styles.userInfoBlock}>
                    <Link to={`/profile/${authorId}`}>
                      <img src={userData.picture || 'https://via.placeholder.com/150'} alt={'User profile'} className={styles.userProfilePic} />
                    </Link>
                    <h4>{userData.name}</h4>
                    <p>Email: {userData.email}</p>
                    <Button variant='dark' onClick={handleMessage}>Message User!</Button>
                  </div>
                ) : (
                  <p>Loading user info...</p>
                )}
              </div>
            </div>
          ) : (
            <p>No data available.</p>
          )}
        </CustomModal.Body>
      </div>
      <Modal show={showShareModal} onHide={handleCloseShareModal} onClick={(e) => e.stopPropagation()}>
        <Modal.Header closeButton>
          <Modal.Title className={styles.modalTitle}>Share Post</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {/* Share options */}
          <Form>
            <Button variant={selectedOption === 'friend' ? 'primary' : 'outline-primary'} onClick={() => setSelectedOption('friend')} className="form-check mb-2">
              Select a Friend
            </Button>
            <Button variant={selectedOption === 'community' ? 'primary' : 'outline-primary'} onClick={() => setSelectedOption('community')} className="form-check mb-2">
              Community Share
            </Button>
            {/* Friend selection */}
            {selectedOption === 'friend' && (
              <div>
                {friendsLoading ? <p>Loading friends...</p> : allFriends.length === 0 ? <p>No friends found. Add some friends first!</p> : (
                  <div className={styles.friendGrid}>
                    {allFriends.map((friend) => (
                      <div key={friend.friend_id} className={styles.friendItem}>
                        <img src={friend.profile_picture} alt={friend.name} className={selectedFriend === friend.friend_id ? `${styles.profilePic} ${styles.selected}` : styles.profilePic} onClick={() => setSelectedFriend(friend.friend_id)} />
                        <span className={styles.friendName}>{friend.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Community selection */}
            {selectedOption === 'community' && (
              <Form.Group controlId="communitySelect" className="mt-3">
                <Form.Label>Select a Community</Form.Label>
                <Form.Control as="select" value={selectedCommunity || ''} onChange={(e) => setSelectedCommunity(e.target.value)}>
                  <option value="">Choose...</option>
                  {communities.length > 0 ? (
                    communities.map((community) => (
                      <option key={community.id} value={community.id}>
                        {community.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading communities...</option>
                  )}
                </Form.Control>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseShareModal}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmShare} disabled={!selectedFriend && !selectedCommunity}>Share</Button>
        </Modal.Footer>
      </Modal>
  
      {/* Modal for editing */}
      <Modal show={isEditing} onHide={() => setIsEditing(false)} onClick={(e) => e.stopPropagation()}>
        <Modal.Header closeButton style={{ color: 'black' }}>
          <Modal.Title>Edit Post</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ color: 'black' }}>
          {/* Form for editing post */}
          <Form>
            <Form.Group controlId="editTitle">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="editDescription" className="mt-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="editTags" className="mt-3">
                <Form.Label>Tags (comma-separated)</Form.Label>
                <Form.Control
                  type="text"
                  value={editedTags}
                  onChange={(e) => setEditedTags(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="editImage" className="mt-3">
                <Form.Label>Image URL</Form.Label>
                <Form.Control
                  type="text"
                  value={editedImage}
                  onChange={(e) => setEditedImage(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="editVideo" className="mt-3">
                <Form.Label>Video URL</Form.Label>
                <Form.Control
                  type="text"
                  value={editedVideo}
                  onChange={(e) => setEditedVideo(e.target.value)}
                />
              </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(post_id)} disabled={loading}>{loading ? 'Deleting...' : 'Delete Post'}</Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};  

CustomModal.Header = ({ closeButton, onHide }) => (
  <div className={styles.modalHeader}>
    {closeButton && (
      <button className={styles.closeButton} onClick={onHide}>✕</button>
    )}
  </div>
);

CustomModal.Body = ({ children, className }) => (
  <div className={`${styles.modalBody} ${className || ""}`}>{children}</div>
);