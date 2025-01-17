import React, { useEffect } from 'react';
import { useNavigate} from 'react-router-dom';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

const SaveUserToBackend = () => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const saveUserToBackend = async () => {
      if (!isAuthenticated || !user) return;
     
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch('http://localhost:8080/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            user_id: user.sub
          }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          if (response.status === 201 && data.message === 'User created successfully') {
            // Redirect to profile page to complete info setup
            navigate('/profile');
          }
        } else {
          throw new Error('Failed to save user');
        }
      } catch (error) {
        console.error('Error saving user:', error);
      }
    };

    saveUserToBackend();
  }, [isAuthenticated, user, navigate]);

  return null; // This component renders nothing; it only runs the effect
};


const Auth0ProviderWithHistory = ({ children }) => {
  const navigate = useNavigate();

  const domain = process.env.REACT_APP_AUTH0_DOMAIN;
  const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
  const redirectUri = process.env.REACT_APP_AUTH0_CALLBACK_URL;
  const audience = process.env.REACT_APP_AUTH0_AUDIENCE;

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || window.location.pathname);
  };
  
  if (!(domain && clientId && audience)) {
    return null;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        audience: audience,
        redirect_uri: redirectUri,
      }}
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
