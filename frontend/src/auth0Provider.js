import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

const SaveUserToBackend = () => {
  const { user, isAuthenticated } = useAuth0();

  useEffect(() => {
    const saveUserToBackend = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const response = await fetch('http://localhost:8080/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            picture: user.picture,
            nickname: user.nickname,
            created_at: user.updated_at, // Use updated_at for now as Auth0 does not provide created_at by default
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save user to the backend');
        }
        console.log('User saved successfully after login');
      } catch (error) {
        console.error('Error saving user:', error);
      }
    };

    saveUserToBackend();
  }, [isAuthenticated, user]);

  return null; // This component renders nothing; it only runs the effect
};

const Auth0ProviderWithHistory = ({ children }) => {
  const domain = process.env.REACT_APP_AUTH0_DOMAIN;
  const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;

  const navigate = useNavigate();

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      redirectUri={window.location.origin}
      onRedirectCallback={onRedirectCallback}
    >
      {/* Add SaveUserToBackend here */}
      <SaveUserToBackend />
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithHistory;
