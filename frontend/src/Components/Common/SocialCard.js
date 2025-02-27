import React, { useState, useEffect } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';
import { FaThumbsUp, FaShare, FaHeart, FaRegHeart, FaComment } from 'react-icons/fa';
import styles from './SocialCard.module.css';
import axios from 'axios';

export const SocialCard = ({
  post_id,
  image,
  video,
  title,
  description,
  profilePic,
  author,
  authorId,
  initialLikes = 0,
  initialShares = 0,
  isLikedAlready,
  tags = [],
  listingId,
  reloadFeed,
  onShowComments,
  allFriends = [],
  friendsLoading = true
}) => {
  const { user, getAccessTokenSilently } = useAuth0();

  const [likes, setLikes] = useState(initialLikes);
  const [shares, setShares] = useState(initialShares);
  const [isLiked, setIsLiked] = useState(isLikedAlready);
  const [isShared, setIsShared] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCommentMode, setIsComment] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedDescription, setEditedDescription] = useState(description);
  const [editedTags, setEditedTags] = useState(tags.join(', '));
  const [editedImage, setEditedImage] = useState(image);
  const [editedVideo, setEditedVideo] = useState(video);
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState(['Tech Group', 'Gaming Hub']);
  const [numComments, setNumComments] = useState(0);

  const fetchNumComments = async (postId) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/count/${postId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch number of comments");
      const data = await response.json();
      setNumComments(data.comment_count || 0);
    } catch (error) {
      console.error("Error fetching number of comments:", error);
    }
  };

  useEffect(() => {
    if (post_id) {
      fetchNumComments(post_id);
    }
  }, [post_id]);

  // Reverted to Old Version's Like Logic
  const handleLikeClick = async (e) => {
    e.stopPropagation();
    const newLikeStatus = !isLiked;
    setIsLiked(newLikeStatus);
    try {
      const token = await getAccessTokenSilently();
      const response = await likeAPICall(post_id, newLikeStatus, token, user.sub); // Old version used user.sub
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
    setShowShareModal(false);
    setAlertMessage('Post shared successfully!');
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    try {
      const token = await getAccessTokenSilently();
      const action = isFavorited ? 'remove' : 'add';
      const success = await favoriteAPICall(listingId, action, token);
      if (success) {
        setIsFavorited(!isFavorited);
        setAlertMessage(isFavorited ? 'Removed from favorites' : 'Added to favorites');
        setTimeout(() => setAlertMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      setAlertMessage('Failed to update favorite. Please try again later.');
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

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

  const handleViewItem = () => {
    if (listingId) {
      const fullLink = `${window.location.origin}/marketplace?listingId=${listingId}`;
      window.open(fullLink, '_blank');
    }
  };

  return (
    <div className={styles.socialCard}>
      <div className={styles.header}>
        <img src={profilePic} alt="Profile" className={styles.profilePic} />
        <span className={styles.author}>{author}</span>
      </div>

      {video ? (
        <video className={styles.media} controls>
          <source src={video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        image && <img src={image} alt="Post content" className={styles.media} />
      )}

      <div className={styles.viewItemBar} onClick={(e) => e.stopPropagation()}>
        <Button variant="primary" onClick={handleViewItem} className={styles.viewItemButton}>
          View Item
        </Button>
      </div>

      <div className={styles.body}>
        <h5 className={styles.title}>{title}</h5>
        <p className={styles.description}>{description}</p>
      </div>

      {tags.filter(tag => tag.trim() !== "").length > 0 && (
        <div className={styles.tagsContainer}>
          {tags
            .filter(tag => tag.trim() !== "") // Remove empty tags
            .map((tag, i) => (
              <span key={i} className={styles.tag}>{tag}</span>
            ))}
        </div>
      )}

      <div className={styles.footer}>
        <Button
          variant="light"
          onClick={handleLikeClick}
          className={styles.button}
          style={{ color: isLiked ? 'blue' : 'gray' }}
        >
          <FaThumbsUp style={{ marginRight: '5px' }} />
          {likes}
        </Button>
        <Button
          variant="light"
          onClick={(e) => { e.stopPropagation(); onShowComments(post_id); }}
          className={styles.button}
          style={{ color: isCommentMode ? 'blue' : 'gray' }}
        >
          <FaComment style={{ marginRight: '5px' }} />
          {numComments}
        </Button>
        {user?.sub !== authorId && (
          <Button
            variant="light"
            onClick={handleFavoriteClick}
            className={styles.button}
            style={{ color: isFavorited ? 'red' : 'gray' }}
          >
            {isFavorited ? <FaHeart /> : <FaRegHeart />}
          </Button>
        )}
        <Button
          variant="light"
          onClick={handleShareClick}
          className={styles.button}
          style={{ color: isShared ? 'green' : 'gray' }}
        >
          <FaShare style={{ marginRight: '5px' }} />
          {shares}
        </Button>
        {user?.sub === authorId && (
          <Button
            variant="outline-warning"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          >
            ✏️ Edit
          </Button>
        )}
      </div>

      {alertMessage && <div className={styles.alert}>{alertMessage}</div>}

      <Modal show={showShareModal} onHide={handleCloseShareModal} onClick={(e) => e.stopPropagation()}>
        <Modal.Header closeButton>
          <Modal.Title className={styles.modalTitle}>Share Post</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          <Form>
            <Button
              variant={selectedOption === 'friend' ? 'primary' : 'outline-primary'}
              onClick={() => setSelectedOption('friend')}
              className="form-check mb-2"
            >
              Select a Friend
            </Button>
            <Button
              variant={selectedOption === 'community' ? 'primary' : 'outline-primary'}
              onClick={() => setSelectedOption('community')}
              className="form-check mb-2"
            >
              Community Share
            </Button>
            {selectedOption === 'friend' && (
              <>
                {friendsLoading ? (
                  <p>Loading friends...</p>
                ) : allFriends.length === 0 ? (
                  <p>No friends found. Add some friends first!</p>
                ) : (
                  <div className={styles.friendGrid}>
                    {allFriends.map((friend) => (
                      <div key={friend.friend_id} className={styles.friendItem}>
                        <img
                          src={friend.profile_picture}
                          alt={friend.name}
                          className={
                            selectedFriend === friend.friend_id
                              ? `${styles.profilePic} ${styles.selected}`
                              : styles.profilePic
                          }
                          onClick={() => setSelectedFriend(friend.friend_id)}
                        />
                        <span className={styles.friendName}>{friend.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {selectedOption === 'community' && (
              <Form.Group controlId="communitySelect" className="mt-3">
                <Form.Label>Select a Community</Form.Label>
                <Form.Control
                  as="select"
                  value={selectedCommunity || ''}
                  onChange={(e) => setSelectedCommunity(e.target.value)}
                >
                  <option value="">Choose...</option>
                  <option value="Tech Group">Tech Group</option>
                  <option value="Gaming Hub">Gaming Hub</option>
                </Form.Control>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseShareModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmShare}
            disabled={!selectedFriend && !selectedCommunity}
          >
            Share
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={isEditing} onHide={() => setIsEditing(false)} onClick={(e) => e.stopPropagation()}>
        <Modal.Header closeButton style={{ color: 'black' }}>
          <Modal.Title>Edit Post</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ color: 'black' }}>
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
          <Button variant="secondary" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleDelete(post_id)} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Post'}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Reverted to Old Version's Like API Call
const likeAPICall = async (post_id, isLiked, token, userId) => {
  try {
    const URL = `${process.env.REACT_APP_BACKEND_URL}/api/feed/${post_id}/like`;
    const method = isLiked ? 'POST' : 'POST'; // Old version bug: always POST
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

const favoriteAPICall = async (listingId, action, token) => {
  try {
    const URL = `${process.env.REACT_APP_BACKEND_URL}/api/favorite/${listingId}`;
    const method = action === 'add' ? 'POST' : 'DELETE';
    const response = await fetch(URL, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) return true;
    const errorData = await response.json();
    throw new Error(errorData.error || 'Something went wrong');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};