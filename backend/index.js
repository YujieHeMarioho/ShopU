import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import authMiddleware from './middleware/auth.js'; 

// import routes
import favoritesRoutes from './routes/favorites.js';
import userRoutes from './routes/users.js';
import friendsRoutes from './routes/friends.js';
import communityRoutes from './routes/communities.js'
import privacyPolicies from './routes/privacyPolicies.js';
import feed from './routes/feed.js';
import listings from './routes/listings.js';
import filters from './routes/filters.js';
import messagesRoutes from './routes/messages.js';
import conversationsRoutes from './routes/conversations.js';
import userPreferenceRoutes from './routes/userPreferences.js';

dotenv.config();

if (!(process.env.PORT && process.env.CLIENT_ORIGIN_URL)) {
  throw new Error(
    "Missing required environment variables."
  );
}

const { Pool } = pkg;
const app = express();
const port = parseInt(process.env.PORT, 10);

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // Adjust based on your SSL requirements
  },
});

// Middleware

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN_URL,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type']    
  })
);

app.use(bodyParser.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Hello from backend! V1');
});

app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users;');
    res.status(200).json({ success: true, timestamp: result.rows});
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Error getting users', error });
  }
});

app.use('/api', feed);

// enforce on all endpoints to validate the signed in user
app.use(authMiddleware);

app.use('/api', favoritesRoutes)
app.use('/api', communityRoutes)
app.use('/api', userRoutes)
app.use('/api', friendsRoutes)
app.use('/api', privacyPolicies)
app.use('/api', listings);
app.use('/api', filters);
app.use('/api', userPreferenceRoutes)

app.use('/api/messages', messagesRoutes);

app.use('/api/conversations', (req, res, next) => {
  console.log('Conversations route hit');
  next();
}, conversationsRoutes);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on ${process.env.BACKEND_URL}`);
  });
}

export { app };