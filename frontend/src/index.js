// frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './styles/global.css';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';

// Auth0 configuration
const domain = "dev-107kt4cyglr5l6b7.us.auth0.com";
const clientId = "C6TA6oeIol2EX7z1mIxpEVqgBTImqbTQ";
const redirectUri = window.location.origin + "/callback"; // http://localhost:3000/callback

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    redirectUri={redirectUri}
    cacheLocation="localstorage" // Optional: Persist authentication state
    useRefreshTokens={true} // Optional: Use refresh tokens
  >
    <BrowserRouter>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </BrowserRouter>
  </Auth0Provider>
);

reportWebVitals();
