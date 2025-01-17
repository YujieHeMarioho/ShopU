import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaThumbsUp, FaShare } from 'react-icons/fa';
import styles from './SocialCard.module.css';
import { useAuth0 } from '@auth0/auth0-react';

export const SocialCard = ({
  post_id,               // Directly passed post_id
  image,
  video,
  title,
  description,
  profilePic,
  author,
  initialLikes = 0,
  initialShares = 0,
  tags = [],             // Tags for the post
}) => {
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const [likes, setLikes] = useState(initialLikes);
  const [shares, setShares] = useState(initialShares);
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Handle like button click
  const handleLikeClick = async () => {
    const newLikeStatus = !isLiked;
    setIsLiked(newLikeStatus);

    try {
      console.log('Attempting to update like for post:', post_id);
      console.log('New Like Status:', newLikeStatus);

      const token = await getAccessTokenSilently();
      console.log('Access Token:', token);  // Log the token to check if it's correct

      const response = await likeAPICall(post_id, newLikeStatus, token);

      console.log('Response from like API:', response);

      if (response.success) {
        setLikes((prev) => (newLikeStatus ? prev + 1 : prev - 1));
      }
    } catch (error) {
      console.error('Error:', error);
      setAlertMessage('Failed to update like. Please try again later.');
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  // Handle share button click
  const handleShareClick = async () => {
    try {
      console.log('Attempting to share post:', post_id);

      const token = await getAccessTokenSilently();
      console.log('Access Token:', token);  // Log the token to check if it's correct

      const response = await shareAPICall(post_id, token);

      console.log('Response from share API:', response);

      if (response.success) {
        setAlertMessage('Item shared successfully!');
        setTimeout(() => setAlertMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      setAlertMessage('Failed to share item. Please try again later.');
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  // Navigate to the detailed view of the post
  const handleNavigateToItem = () => {
    navigate(`/item/${post_id}`);
  };

  return (
    <div className={styles.socialCard}>
      <div className={styles.header}>
        <img src={profilePic} alt={`${author}'s profile`} className={styles.profilePic} />
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

      <div className={styles.body}>
        <h5 className={styles.title}>{title}</h5>
        <p className={styles.description}>{description}</p>
      </div>

      {/* Tags Section */}
      {tags.length > 0 && (
        <div className={styles.tagsContainer}>
          {tags.map((tag, index) => (
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
          onClick={handleShareClick}
          className={styles.button}
          style={{ color: isShared ? 'green' : 'gray' }}
        >
          <FaShare style={{ marginRight: '5px' }} />
          {shares}
        </Button>
        <Button variant="primary" onClick={handleNavigateToItem} className={styles.viewItemButton}>
          View Item
        </Button>
      </div>

      {alertMessage && <div className={styles.alert}>{alertMessage}</div>}
    </div>
  );
};

// API calls for Like and Share
const likeAPICall = async (post_id, isLiked, token) => {
  try {
    const URL = `http://localhost:8080/api/feed/${post_id}/like`;
    const method = isLiked ? 'POST' : 'DELETE'; // POST for like, DELETE for removing like
    const response = await fetch(URL, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return await response.json(); // Assume the API sends back success
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Something went wrong');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const shareAPICall = async (post_id, token) => {
  try {
    const URL = `http://localhost:8080/api/feed/${post_id}/share`; // Adjusted route to match backend
    const response = await fetch(URL, {
      method: 'POST', // Assuming POST for sharing action
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return await response.json(); // Assume the API sends back success
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Something went wrong');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export default SocialCard;
