import express from 'express';
import { auth } from 'express-openid-connect';
import dotenv from 'dotenv';
import multer from 'multer';

// import routes
import favoritesRoutes from './routes/favorites.js';

// Load environment variables from .env file
dotenv.config(); 

// Initialize Express app
const app = express();
const port = 8080;

app.use(express.json());

// Multer configuration for handling FormData
const upload = multer();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Auth0 configuration
const config = {
  authRequired: false, // Set to true if authentication is required for all routes
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: 'http://localhost:8080', // Replace with your base URL in production
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};

// Attach the Auth0 authentication router
app.use(auth(config));

app.use('/api', favoritesRoutes)

// Basic route to check authentication status
app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

// Example protected route
app.get('/profile', (req, res) => {
  if (req.oidc.isAuthenticated()) {
    res.send(`Welcome ${req.oidc.user.name}`);
  } else {
    res.send('You need to log in to view this page.');
  }
});

// Route to handle POST request to /api/listings
// Use multer's `upload.none()` to handle non-file form data
app.post('/api/listings', upload.none(), (req, res) => {
  // Now req.body should contain the form data
  const formData = req.body;

  console.log('Received form data:', formData);

  // Process the data as needed (e.g., save to a database)

  // Send a response back to the client
  res.status(200).json({ message: 'Form data received successfully', data: formData });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});