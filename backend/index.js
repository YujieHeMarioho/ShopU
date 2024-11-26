import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

// import routes
import favoritesRoutes from './routes/favorites.js';
import userRoutes from './routes/users.js';

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
app.use('/api', userRoutes)

// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
