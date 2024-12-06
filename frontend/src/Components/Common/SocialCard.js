import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaThumbsUp, FaShare, FaHeart, FaRegHeart } from 'react-icons/fa';
import styles from './SocialCard.module.css';

export const SocialCard = ({
  image,
  video,
  title,
  description,
  profilePic,
  author,
  initialLikes = 0,
  initialShares = 0,
  itemDetails,
  tags = [], // New prop for tags
}) => {
  const navigate = useNavigate();
  const [likes, setLikes] = useState(initialLikes);
  const [shares, setShares] = useState(initialShares);
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const handleLikeClick = () => {
    setIsLiked((prev) => !prev);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1)); // Toggle like count
  };

  const handleShareClick = () => {
    setIsShared((prev) => !prev);
    setShares((prev) => (isShared ? prev - 1 : prev + 1)); // Toggle share count
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    try {
      const action = isFavorited ? 'remove' : 'add';
      const success = await favoriteAPICall(itemDetails.id, action);

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

  const handleNavigateToItem = () => {
    navigate(`/item/${itemDetails.id}`, { state: itemDetails });
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
        <Button
          variant="light"
          onClick={handleFavoriteClick}
          className={styles.button}
          style={{ color: isFavorited ? 'red' : 'gray' }}
        >
          {isFavorited ? <FaHeart /> : <FaRegHeart />}
        </Button>
        <Button variant="primary" onClick={handleNavigateToItem} className={styles.viewItemButton}>
          View Item
        </Button>
      </div>

      {alertMessage && <div className={styles.alert}>{alertMessage}</div>}
    </div>
  );
};

const favoriteAPICall = async (listingId, action) => {
  try {
    const URL = `http://localhost:8080/api/favorite/${listingId}`;
    const method = action === 'add' ? 'POST' : 'DELETE';
    const response = await fetch(URL, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return true;
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
