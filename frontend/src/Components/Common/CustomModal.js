import React, { useState, useEffect } from "react";
import styles from "./CustomModal.module.css";
import { useAuth0 } from '@auth0/auth0-react';
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import CommentSection from "./CommentSection";
import { FaThumbsUp, FaShare, FaHeart, FaRegHeart } from 'react-icons/fa';

export const CustomModal = ({ show, onHide, centered, selectedCard }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [userData, setUserData] = useState(null);
  const authorId = selectedCard?.author_id;

  const [likes, setLikes] = useState(0);
  const [shares, setShares] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const navigate = useNavigate();

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
    }
  }, [user, authorId, getAccessTokenSilently]);

  useEffect(() => {
    if (selectedCard?.post_id) {
      const fetchPostDetails = async () => {
        try {
          const token = await getAccessTokenSilently();
          const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/feed/${selectedCard.post_id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          setLikes(response.data.likes || 0);
          setShares(response.data.shares || 0);
          setIsLiked(response.data.isLiked || false);
          setIsFavorited(response.data.isFavorited || false);
        } catch (error) {
          console.error('Error fetching post details:', error);
        }
      };
      fetchPostDetails();
    }
  }, [selectedCard, getAccessTokenSilently]);

  if (!show) return null;

  const isSocialCard = selectedCard && selectedCard.post_id;

  const handleLikeClick = async () => {
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/feed/${selectedCard.post_id}/like`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setIsLiked(!isLiked);
      setLikes(isLiked ? likes - 1 : likes + 1);
    } catch (error) {
      console.error('Error updating like status:', error);
    }
  };

  const handleFavoriteClick = async () => {
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/feed/${selectedCard.post_id}/favorite`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  const handleShareClick = async () => {
    try {
      setIsShared(true);
      setShares(shares + 1);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleEdit = () => {
    console.log("Editing post:", selectedCard.post_id);
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
      <div className={`${styles.modalContent} ${centered ? styles.centered : ""}`} onClick={(e) => e.stopPropagation()}>
        <CustomModal.Header closeButton onHide={onHide} />
        <CustomModal.Body className={styles.modalBody}>
          {isSocialCard ? (
            <div className={styles.modalContentWrapper}>
              <div className={styles.socialCardSection}>
                <img src={selectedCard.image} alt={selectedCard.title} className={styles.modalCardImage} />
                <h3>{selectedCard.title}</h3>
                <p>{selectedCard.content}</p>
                <div className={styles.actionButtons}>
                  <Button variant="light" onClick={handleLikeClick} className={styles.button} style={{ color: isLiked ? 'blue' : 'gray' }}>
                    <FaThumbsUp style={{ marginRight: '5px' }} />
                    {likes} Likes
                  </Button>
                  {user?.sub !== authorId && (
                    <Button variant="light" onClick={handleFavoriteClick} className={styles.button} style={{ color: isFavorited ? 'red' : 'gray' }}>
                      {isFavorited ? <FaHeart /> : <FaRegHeart />} Favorite
                    </Button>
                  )}
                  <Button variant="light" onClick={handleShareClick} className={styles.button} style={{ color: isShared ? 'green' : 'gray' }}>
                    <FaShare style={{ marginRight: '5px' }} />
                    {shares} Shares
                  </Button>
                  {user?.sub === selectedCard.author_id && (<button className={styles.editButton} onClick={handleEdit}>✏️ Edit</button>)}
                </div>
                <div className={styles.socialCardFooter}>
                  <span>ShopU</span>
                </div>
                <CommentSection selectedPostId={selectedCard.post_id} userId={user?.sub} />
              </div>
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