// frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './styles/global.css';
import { BrowserRouter } from 'react-router-dom';
import Auth0ProviderWithHistory from './auth0Provider';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const root = ReactDOM.createRoot(document.getElementById('root'));

// Set PayPal initial options, including the client ID from .env file
const paypalOptions = {
  "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID, // Client ID from .env
  currency: "USD", // Set the default currency
};

root.render(
  <PayPalScriptProvider options={paypalOptions}>
    <BrowserRouter>
      <React.StrictMode>
        <Auth0ProviderWithHistory>
          <App />
        </Auth0ProviderWithHistory>
      </React.StrictMode>
    </BrowserRouter>
  </PayPalScriptProvider>
);

reportWebVitals();
