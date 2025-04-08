import React, { act, useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import styles from './CommunityCard.module.css';
import { useAuth0 } from '@auth0/auth0-react';
import {FaEllipsisH} from 'react-icons/fa';
import ReportModal from './ReportModal';


export const CommunityCardComponent = ({ image, title, description, communityId, onCommunityClick}) => {
  const { getAccessTokenSilently } = useAuth0();
  const [isJoined, setIsJoined] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleJoinClick = async (e) => {
    setAlertMessage("Adding Community...")
    e.stopPropagation(); // Prevents triggering the onCardClick if you have it

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/communities`, {
        method: "POST",
        body: JSON.stringify({ community_id: `${communityId}` }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
   
      if (response.ok){
        window.location.reload()
        return true; 
      } 
      else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }
    } catch(error){
      console.error('Error:', error);
      setAlertMessage('Error:' + error)
      setAlertMessage('Failed to update community. Please try again later.')
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const handleCardClick = (e) => {
    // Prevent clicks from buttons
    if (e.target.closest('.btn')) {
      return;
    }

    window.location.href=`/Community/${communityId}`;
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleReportClick = (e) => {
    e.stopPropagation();
    setShowReportModal(true)
    setShowDropdown(false);
  };

  const submitReport = async (reason, description) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'community',
          reportedItemId: communityId,
          reason,
          description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      setShowReportModal(false);
      alert('Report submitted successfully');
    } catch (error) {
      console.error('Error reporting comment:', error);
      alert('Failed to submit report');
    }
  };

  return (
    <div>
      {/* Display alert if there is a message */}
      {alertMessage && (
        <Alert variant="info" className={styles.alert}>
          {alertMessage}
        </Alert>
      )}
      
      <Card className={styles.card} onClick={handleCardClick}>
        <div className={styles.imageContainer}>
          <Card.Img variant="top" src={image} alt={title} className={styles.cardImage} />
          
        </div>
        <Card.Body className={styles.cardBody}>
          <Card.Title className={styles.cardTitle}>{title}</Card.Title>
          <Card.Text className={styles.cardDescription}>{description}</Card.Text>
        </Card.Body>
        <div
          className={styles.threeDotMenu}
          onClick={toggleDropdown}
        >
        <FaEllipsisH />
        {showDropdown && (
          <div className={styles.threeDotDropdown}>
            <div className={styles.dropdownItem} onClick={(e) => handleReportClick(e)}>
              Report Community
            </div>
          </div>
        )}
      </div>
        <Button
            variant="light"
            className={`${styles.joinButton} ${isJoined ? styles.joined : ''}`}
            onClick={handleJoinClick}
          >
            Join
            {/*isJoined ? '💖' : '🤍'*/}
          </Button>
      </Card>

      {showReportModal && (
        <div onClick={(e) => e.stopPropagation()}>
          <ReportModal
            show={showReportModal}
            onHide={() => setShowReportModal(false)}
            onSubmit={submitReport}
            itemType="community"
          />
        </div>
      )}
    </div>
  );
};