// backend/index.js

import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import pool from './pool.js'; // Ensure correct path
import cors from 'cors';
import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import bodyParser from 'body-parser';

// Load environment variables
dotenv.config();

const app = express();
const port = 8080;

// Middleware
app.use(express.json());
app.use(bodyParser.json());

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
}));

// JWT Middleware to protect /api routes
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
  issuer: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
});

// Multer configuration for handling FormData
const upload = multer();

// Route to handle POST request to /api/listings
app.post('/api/listings', checkJwt, upload.none(), (req, res) => {
  const formData = req.body;
  console.log('Received form data:', formData);
  res.status(200).json({ message: 'Form data received successfully', data: formData });
});

// Route to synchronize user data upon login/signup
app.post('/api/users', checkJwt, async (req, res) => {
  console.log('Received POST /api/users');
  const { sub, email, name, picture } = req.body; // 'sub' is the unique Auth0 user ID

  if (!sub || !email || !name) {
    return res.status(400).json({ error: 'Missing required user information.' });
  }

  try {
    // Split name into first and last names
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if the user already exists in the database
    const existingUser = await pool.query('SELECT * FROM users WHERE auth0_id = $1', [sub]);

    if (existingUser.rows.length > 0) {
      // User exists, update their information
      await pool.query(
        'UPDATE users SET edu_email = $1, profile_picture = $2, first_name = $3, last_name = $4 WHERE auth0_id = $5',
        [email, picture, firstName, lastName, sub]
      );
      console.log(`User ${name} updated successfully.`);
    } else {
      // New user, insert their information
      await pool.query(
        'INSERT INTO users (edu_email, profile_picture, first_name, last_name, create_date, is_admin, auth0_id) VALUES ($1, $2, $3, $4, NOW(), false, $5)',
        [email, picture, firstName, lastName, sub]
      );
      console.log(`User ${name} inserted successfully.`);
    }

    // Respond with success
    res.status(200).json({ message: 'User synchronized successfully.' });
  } catch (error) {
    console.error('Error synchronizing user data:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Route to get user data based on auth0_id
app.get('/api/users/:auth0_id', checkJwt, async (req, res) => {
  const { auth0_id } = req.params;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE auth0_id = $1', [auth0_id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userResult.rows[0];
    res.status(200).json(userData);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.send('Hello from backend!');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
