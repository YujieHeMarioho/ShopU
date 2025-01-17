import React, { useState, useEffect } from 'react';
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
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const [likes, setLikes] = useState(initialLikes);
  const [shares, setShares] = useState(initialShares);
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    if (user) {
      console.log('User ID:', user.sub); // Access the user ID (sub) here
    }
  }, [user]);

  const handleLikeClick = async () => {
    const newLikeStatus = !isLiked;
    setIsLiked(newLikeStatus);
  
    try {
      const token = await getAccessTokenSilently();
      const response = await likeAPICall(post_id, newLikeStatus, token, user.sub); // Pass user.sub
  
      if (response.success) {
        setLikes(response.likeCount);  // Use the updated like count from the backend
      }
    } catch (error) {
      setAlertMessage('Failed to update like. Please try again later.');
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };
  
  

  const handleShareClick = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await shareAPICall(post_id, token, user.sub); // Pass user.sub

      if (response.success) {
        setAlertMessage('Item shared successfully!');
        setTimeout(() => setAlertMessage(null), 3000);
      }
    } catch (error) {
      setAlertMessage('Failed to share item. Please try again later.');
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

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

const likeAPICall = async (post_id, isLiked, token, userId) => {
  try {
    const URL = `http://localhost:8080/api/feed/${post_id}/like`;
    const method = isLiked ? 'POST' : 'POST'; // Keep it POST for both like/unlike
    const response = await fetch(URL, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-ID': userId, // Pass user ID as a custom header if needed
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


const shareAPICall = async (post_id, token, userId) => {
  try {
    const URL = `http://localhost:8080/api/feed/${post_id}/share`;
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-ID': userId, // Pass user ID as a custom header if needed
      },
    });

    if (!response.ok) {
      throw new Error('Error sharing post.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
