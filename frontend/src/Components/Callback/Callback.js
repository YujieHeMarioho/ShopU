// frontend/src/Components/Callback/Callback.js

import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Callback = () => {
  const { isLoading, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('isLoading:', isLoading);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);

    const sendUserData = async () => {
      if (isAuthenticated && user) {
        try {
          console.log('Authenticated, sending user data to backend.');

          // Retrieve access token
          const token = await getAccessTokenSilently();
          console.log('Access Token retrieved:', token);

          // Send user data to backend
          const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/users`,
            {
              sub: user.sub,
              email: user.email,
              name: user.name,
              picture: user.picture,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log('Backend response:', response.data);

          // Redirect to homepage after successful synchronization
          navigate('/');
        } catch (error) {
          console.error('Error sending user data to backend:', error);
        }
      }
    };

    if (!isLoading) {
      sendUserData();
    }
  }, [isLoading, isAuthenticated, user, getAccessTokenSilently, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>Redirecting...</div>;
};

export default Callback;
