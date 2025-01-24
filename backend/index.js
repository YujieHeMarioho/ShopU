import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import listings from './routes/listings.js';
import filters from './routes/filters.js';
import favorites from './routes/favorites.js';
import authMiddleware from './middleware/auth.js'; 

// import routes
import favoritesRoutes from './routes/favorites.js';
import userRoutes from './routes/users.js';
import friendsRoutes from './routes/friends.js';
import communityRoutes from './routes/communities.js'
import privacyPolicies from './routes/privacyPolicies.js';
import messagesRoutes from './routes/messages.js';
import conversationsRoutes from './routes/conversations.js';

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
app.use(cors());

// app.use(
//   cors({
//     origin: CLIENT_ORIGIN_URL,
//     methods: ["GET"],
//     allowedHeaders: ["Authorization", "Content-Type"],
//     maxAge: 86400,
//   })
// );

app.use(bodyParser.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Hello from backend!');
});

// enforce on all endpoints to validate the signed in user
app.use(authMiddleware);

app.use('/api', favoritesRoutes)
app.use('/api', communityRoutes)
app.use('/api', userRoutes)
app.use('/api', friendsRoutes)
app.use('/api', privacyPolicies)

// Mount the listing routes
app.use('/api', listings);
app.use('/api', filters);
app.use('/api', favorites);

app.use('/api/messages', messagesRoutes);

app.use('/api/conversations', (req, res, next) => {
  console.log('Conversations route hit');
  next();
}, conversationsRoutes);

// Error handling for unauthorized access
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).send('Invalid or missing token');
  }
  next(err);
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
