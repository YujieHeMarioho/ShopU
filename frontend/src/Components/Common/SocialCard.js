import React, { useState, useEffect } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';
import { FaThumbsUp, FaShare, FaHeart, FaRegHeart, FaComment } from 'react-icons/fa';
import styles from './SocialCard.module.css';
import axios from 'axios';
import {Link} from "react-router-dom";

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
  isFavoritedAlready,
  tags = [],
  listingId,
  reloadFeed,
  onShowComments,
  allFriends = [],
  friendsLoading = true,
}) => {
  const { user, getAccessTokenSilently } = useAuth0();

  const [likes, setLikes] = useState(initialLikes);
  const [shares, setShares] = useState(initialShares);
  const [isLiked, setIsLiked] = useState(isLikedAlready);
  const [isShared, setIsShared] = useState(false);
  const [isFavorited, setIsFavorited] = useState(isFavoritedAlready);
  const [isCommentMode, setIsComment] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedDescription, setEditedDescription] = useState(description);
  const [editedTags, setEditedTags] = useState(tags.join(', '));
  const [editedImage, setEditedImage] = useState(image);
  const [editedVideo, setEditedVideo] = useState(video);
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [numComments, setNumComments] = useState(0);

  const [followStatus, setFollowStatus] = useState(null);
  const [showFollowButton, setShowFollowButton] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (allFriends.length > 0) {
        if (allFriends.some(friend => friend.friend_id === authorId)) {
          setFollowStatus('Followed');
          setShowFollowButton(false);
        } else {
          setFollowStatus('Follow');
          setShowFollowButton(true);
        }
      }
  
      // Check if there is a follow request for this user (requester/receiver check)
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/follow/status/${authorId}`, // API endpoint to check follow request status
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );
  
        if (!response.ok) throw new Error('Failed to fetch follow request status');
        const data = await response.json();
  
        // Check if the user has a pending request
        if (data.status === 'requested') {
          setFollowStatus('Requested');
          setShowFollowButton(true);
          
        } else if (data.status === 'followed') {
          setFollowStatus('Followed');
          setShowFollowButton(false);
        }
      } catch (error) {
        console.error('Error checking follow request status:', error);
      }
    };
  
    checkFollowStatus();
  }, [allFriends]);// Now runs when allFriends updates
  

  const handleFollowClick = async (e) => {
    e.stopPropagation();
  
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/follow`,
        { friend_id: authorId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // Ensure response contains status
      if (response.data.status) {
        if (response.data.status === 'requested') {
          setFollowStatus('Requested');
        } else if (response.data.status === 'followed') {
          setFollowStatus('Followed');
          setShowFollowButton(false);
        }
      } else {
        console.warn('No status received from server');
      }
  
      reloadFeed();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };
  
  const handleUnfollowClick = async (e) => {
    e.stopPropagation(); // Prevent event propagation
  
    try {
      const token = await getAccessTokenSilently(); 
      const response = await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/unfollow/${authorId}`, // Passing authorId as friend_id in the URL
        { headers: { Authorization: `Bearer ${token}` } } 
      );
  
      // Update UI states after successful unfollow
      setFollowStatus('Follow'); // Reset the follow status
      setShowFollowButton(true); // Show follow button again after unfollowing
  
      reloadFeed(); // Reload feed (or refresh data) after the unfollow action
  
      console.log('Unfollow successful:', response.data);
  
    } catch (error) {
      // Handle errors during the API call
      console.error('Error unfollowing user:', error);
    }
  };


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
    fetchFavorites();
    if (post_id) {
      fetchNumComments(post_id);
    }
    fetchCommunities();
  }, [post_id]);

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    const newLikeStatus = !isLiked;
    setIsLiked(newLikeStatus);
    try {
      const token = await getAccessTokenSilently();
      const response = await likeAPICall(post_id, newLikeStatus, token, user.sub);
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
      <Link to={`/profile/${authorId}`}>
        <img src={profilePic} alt={'Profile'} className={styles.profilePic} />
      </Link>
      <span className={styles.author}>{author}</span>
      {authorId !== user?.sub && showFollowButton && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={followStatus === 'Follow' ? handleFollowClick : handleUnfollowClick}
          >
            {followStatus}
          </Button>
        )}
    </div>


  {video ? (
        <video className={styles.media} controls>
          <source src={video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        image && <img src={image} alt="Post content" className={styles.media} />
      )}

      {listingId && (
        <div className={styles.viewItemBar} onClick={(e) => e.stopPropagation()}>
          <Button variant="primary" onClick={handleViewItem} className={styles.viewItemButton}>
            View Item
          </Button>
        </div>
      )}

      <div className={styles.body}>
        <h5 className={styles.title}>{title}</h5>
        <p className={styles.description}>{description}</p>
      </div>

      {tags?.length > 0 && (
        <div className={styles.tagsContainer}>
          {tags.filter(tag => tag).map((tag, index) => ( // Exclude NULL or empty values
            <span key={index} className={styles.tag}>
              {tag}
            </span>
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
                onChange={(e) => {setSelectedCommunity(e.target.value);}}
              >
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



export default SocialCard;