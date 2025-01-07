import pool from '../pool.js';
import { jwtDecode } from "jwt-decode";

export const getFriends = async (req, res) => {
  let user_id;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  try {
      const decodedToken = jwtDecode(token); // Decode the token
      user_id = decodedToken.sub;
  } catch (err) {
      console.error('Error decoding token:', err);
      return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const result = await pool.query(
      'SELECT DISTINCT ON (user_id, friend_id) * FROM friends WHERE user_id = $1 OR friend_id = $1;',
      [user_id]
    );

    const friends = result.rows.map(row => ({
      user_id: row.user_id === parseInt(user_id, 10) ? row.friend_id : row.user_id,
      friend_id: row.user_id === parseInt(user_id, 10) ? row.user_id : row.friend_id,
      friended_at: row.friended_at,
    }));

    res.status(200).json(friends);
  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({ message: 'Error getting friends', error });
  }
};



export const addFriend = async (req, res) => {
  try {
    const { friend_id } = req.body;

    let user_id;
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if the friendship already exists
    const existingFriendship = await pool.query(
      'SELECT * FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1);',
      [user_id, friend_id]
    );

    if (existingFriendship.rows.length > 0) {
      return res.status(400).json({ message: 'Friendship already exists.' });
    }

    // Insert a single row to represent the friendship
    const result = await pool.query(
      'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2);',
      [user_id, friend_id]
    );

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Friendship added successfully.' });
    } else {
      res.status(500).json({ message: 'Error adding friendship.' });
    }
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ message: 'Error adding friend', error });
  }
};

export const deleteFriend = async (req, res) => {
  const { friend_id } = req.params;

  let user_id;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  try {
      const decodedToken = jwtDecode(token); // Decode the token
      user_id = decodedToken.sub;
  } catch (err) {
      console.error('Error decoding token:', err);
      return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1);',
      [user_id, friend_id]
    );

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Friendship deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Friendship not found or already deleted.' });
    }
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Error removing friend', error });
  }
};
