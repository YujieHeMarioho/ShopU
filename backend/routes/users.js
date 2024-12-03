import express from 'express';
import pool from '../pool.js'; // Ensure pool is imported correctly
import { getAllUsers, updateUser, getAuth0User, getAllAuth0Users, createUser } from '../controllers/users.js';  

const router = express.Router();

// Existing Routes
router.get('/users', getAllUsers);
router.get('/auth0/users', getAllAuth0Users);
// If the user exists, do nothing; otherwise, create the user in the DB
router.post('/users', createUser);
// Update user info in the Auth0 DB
router.patch('/users', updateUser);
router.get('/users/:user_id', getAuth0User);

// New Route: Get user_id and profile_picture by email
router.get('/user-id/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const result = await pool.query(
      'SELECT user_id, profile_picture FROM users WHERE edu_email = $1;',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(result.rows[0]); // Return user_id and profile details
  } catch (error) {
    console.error('Error fetching user ID:', error);
    res.status(500).json({ message: 'Error fetching user ID', error });
  }
});



router.get('/user/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
      const result = await pool.query(
          'SELECT user_id, name, edu_email, profile_picture FROM users WHERE user_id = $1;',
          [user_id]
      );

      if (result.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(result.rows[0]);
  } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ message: 'Error fetching user details', error });
  }
});


export default router;
