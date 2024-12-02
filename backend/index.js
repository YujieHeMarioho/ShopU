import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import listings from './routes/listings.js';


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

// Get All Users
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users;');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

// Save or Update User
app.post('/api/users', async (req, res) => {
  const {
    email: edu_email,
    name,
    picture: profile_picture,
    nickname,
    created_at,
  } = req.body;

  try {
    const query = `
      INSERT INTO users (
        edu_email,
        profile_picture,
        name,
        create_date,
        is_admin
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (edu_email) 
      DO UPDATE SET 
        profile_picture = EXCLUDED.profile_picture,
        name = EXCLUDED.name
      RETURNING *;
    `;

    const values = [
      edu_email,
      profile_picture,
      name,
      created_at,
      false, // Default is_admin to false for new users
    ];

    const result = await pool.query(query, values);

    res.status(200).json({
      message: 'User saved successfully!',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ message: 'Error saving user', error });
  }
});

// Mount the listing routes
app.use('/api', listings,);

// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
