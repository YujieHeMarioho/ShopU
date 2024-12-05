import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

// import routes
import favoritesRoutes from './routes/favorites.js';
import userRoutes from './routes/users.js';
import friendsRoutes from './routes/friends.js';
import communityRoutes from './routes/communities.js'
import privacyPolicies from './routes/privacyPolicies.js';

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = 8080;

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
app.use(bodyParser.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Hello from backend!');
});

app.use('/api', favoritesRoutes)
app.use('/api', communityRoutes)
app.use('/api', userRoutes)
app.use('/api', friendsRoutes)
app.use('/api', privacyPolicies)



// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
