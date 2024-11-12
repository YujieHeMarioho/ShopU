import express from 'express';
import { auth } from 'express-openid-connect';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = 8080;

// Auth0 configuration
const config = {
  authRequired: false, // Set to true if you want authentication required for all routes
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: 'http://localhost:8080',
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};

// Attach the Auth0 authentication router
app.use(auth(config));

// Basic route to check authentication status
app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
