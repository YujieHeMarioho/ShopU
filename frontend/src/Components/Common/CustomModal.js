import React, { useState, useEffect } from "react";
import styles from "./CustomModal.module.css"; // Import styles
import { useAuth0 } from '@auth0/auth0-react'; // Import Auth0 hook
import axios from "axios";

export const CustomModal = ({ show, onHide, centered, selectedCard }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const { name, picture, email, updated_at, created_at } = user;
  const [userData, setUserData] = useState(null); // Store fetched user data here
  const [formData, setFormData] = useState({
    name: name || '',
    email: email || '',
    picture: ''
  });
  const userId = selectedCard?.userId;

  // Fetch user info on modal open (or if selectedCard changes)
  useEffect(() => {
    if (user && userId) {
      // Fetch additional user info if needed
      const fetchUserInfo = async () => {
        try {
          const token = await getAccessTokenSilently();
          const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/${userId}`, {
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
          setUserData(formattedData); // Update user data state
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      fetchUserInfo();
    }
  }, [user, userId, getAccessTokenSilently]);

  if (!show) return null; // Don't render if modal is not shown

  const isSocialCard = selectedCard && selectedCard.post_id;

  return (
    <div className={styles.modalOverlay} onClick={onHide}>
      <div
        className={`${styles.modalContent} ${centered ? styles.centered : ""}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing on click inside
      >
        <CustomModal.Header closeButton onHide={onHide} />
        <CustomModal.Body className={styles.modalBody}>
          {isSocialCard ? (
            <div className={styles.modalContentWrapper}>
              <div className={styles.socialCardSection}>
                {/* Custom layout for SocialCard */}
                <img
                  src={selectedCard.image}
                  alt={selectedCard.title}
                  className={styles.modalCardImage}
                />
                <h3>{selectedCard.title}</h3>
                <p>{selectedCard.description}</p>

                {/* Action Buttons */}
                <div className={styles.actionButtons}>
                  <button className={styles.likeButton}>👍 Like</button>
                  <button className={styles.favoriteButton}>❤️ Favorite</button>
                  <button className={styles.commentButton}>💬 Comment</button>
                  <button className={styles.shareButton}>🔗 Share</button>
                  <button className={styles.editButton}>✏️ Edit</button>
                </div>

                {/* Custom footer */}
                <div className={styles.socialCardFooter}>
                  <span>{selectedCard.author}</span>
                  <span>{selectedCard.likes_count} Likes</span>
                </div>
              </div>

              {/* User Info Section on the Right */}
              <div className={styles.userInfoSection}>
                {userData ? (
                  <div className={styles.userInfoBlock}>
                    <img
                      src={userData.picture || 'https://via.placeholder.com/150'}
                      alt="User profile"
                      className={styles.userProfilePic}
                    />
                    <h4>{userData.name}</h4>
                    <p>Email: {userData.email}</p>
                    {/* You can add more user info here */}
                  </div>
                ) : (
                  <p>Loading user info...</p>
                )}
              </div>
            </div>
          ) : (
            <p>No data available.</p> // Fallback if no valid SocialCard data
          )}
        </CustomModal.Body>
      </div>
    </div>
  );
};

// **Custom Header Component**
CustomModal.Header = ({ closeButton, onHide }) => (
  <div className={styles.modalHeader}>
    {closeButton && (
      <button className={styles.closeButton} onClick={onHide}>
        ✕
      </button>
    )}
  </div>
);

// **Custom Body Component**
CustomModal.Body = ({ children, className }) => (
  <div className={`${styles.modalBody} ${className || ""}`}>
    {children}
  </div>
);

