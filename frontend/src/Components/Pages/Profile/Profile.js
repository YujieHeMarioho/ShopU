// frontend/src/Components/Pages/Profile/Profile.js

import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import styles from './Profile.module.css'; // Ensure this file exists

const Profile = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently({
            audience: process.env.REACT_APP_AUTH0_AUDIENCE,
            scope: 'read:current_user',
          });

          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/api/users/${user.sub}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setProfileData(response.data);
        } catch (error) {
          console.error('Error fetching profile data:', error);
        }
      }
    };

    fetchProfileData();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    isAuthenticated && (
      <div className={styles.profileContainer}>
        <h1>My Profile</h1>
        <img src={user.picture} alt={user.name} className={styles.profileImage} />
        <div className={styles.profileDetails}>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          {/* Display additional profile data from your database */}
          {profileData && (
            <>
              <p><strong>Phone Number:</strong> {profileData.phone_number}</p>
              <p><strong>Educational Email:</strong> {profileData.edu_email}</p>
              <p><strong>Is Admin:</strong> {profileData.is_admin ? 'Yes' : 'No'}</p>
              {/* Add more fields as necessary */}
            </>
          )}
        </div>
      </div>
    )
  );
};

export default Profile;
