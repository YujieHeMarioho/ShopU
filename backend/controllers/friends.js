import { pool } from '../pool.js'; 
import { jwtDecode } from "jwt-decode";

export const getFriends = async (req, res) => {
  let user_id;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  try {
    const decodedToken = jwtDecode(token);
    user_id = decodedToken.sub;

    // Check if user_id is explicitly passed (optional)
    if (req.query.user_id && req.query.user_id !== user_id) {
      console.error('Mismatched user_id in request.');
      return res.status(401).json({ message: 'Unauthorized request' });
    }
  } catch (err) {
    console.error('Error decoding token:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM friends WHERE user_id = $1;',
      [user_id]
    );

    const friends = result.rows.map((row) => ({
      friend_id: row.friend_id,
      friended_at: row.friended_at,
    }));

    res.status(200).json(friends);
  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({ message: 'Error getting friends', error });
  }
};

export const getFriendsCount = async (req, res) => {
  const { user_id } = req.params;  
  try {
    // Check if user_id is explicitly passed (optional)
    if (req.query.user_id && req.query.user_id !== user_id) {
      console.error('Mismatched user_id in request.');
      return res.status(401).json({ message: 'Unauthorized request' });
    }
  } catch (err) {
    console.error('Error decoding token:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const result = await pool.query(
      'SELECT COUNT(*) AS friend_count FROM friends WHERE user_id = $1;',
      [user_id]
    );

    const friendCount = result.rows[0].friend_count;
    res.status(200).json({ count: friendCount });
  } catch (error) {
    console.error('Error getting friends count:', error);
    res.status(500).json({ message: 'Error getting friends count', error });
  }
};









export const addFriend = async (req, res) => {
  try {
    const { friend_id } = req.body; // Get the friend's ID from the request body
    console.log('Friend ID from request body:', friend_id);

    let user_id;
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    try {
      const decodedToken = jwtDecode(token); // Decode the token to get the user ID
      user_id = decodedToken.sub;
      console.log('Decoded User ID from token:', user_id);
    } catch (err) {
      console.error('Error decoding token:', err);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if the mutual friendship already exists
    console.log(`Checking if friendship exists between ${user_id} and ${friend_id}`);
    const existingFriendship = await pool.query(
      'SELECT * FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1);',
      [user_id, friend_id]
    );

    if (existingFriendship.rows.length > 0) {
      console.log('Friendship already exists.');
      return res.status(400).json({ message: 'Friendship already exists.' });
    }

    // Insert mutual friendship (A -> B and B -> A)
    console.log(`Inserting mutual friendship between ${user_id} and ${friend_id}`);
    const result = await pool.query(
      'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2), ($2, $1);',
      [user_id, friend_id]
    );

    if (result.rowCount === 2) {
      console.log(`Mutual friendship added successfully between ${user_id} and ${friend_id}`);
      res.status(200).json({ message: 'Friendship added successfully.' });
    } else {
      console.error('Error adding mutual friendship.');
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
    const decodedToken = jwtDecode(token);
    user_id = decodedToken.sub;
    console.log('Decoded User ID from token:', user_id);
  } catch (err) {
    console.error('Error decoding token:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    // Delete the friendship in both directions
    console.log(`Deleting friendship between ${user_id} and ${friend_id}`);
    const result = await pool.query(
      'DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1);',
      [user_id, friend_id]
    );

    if (result.rowCount > 0) {
      console.log(`Friendship deleted between ${user_id} and ${friend_id}`);
      res.status(200).json({ message: 'Friendship deleted successfully.' });
    } else {
      console.log('No friendship found to delete.');
      res.status(404).json({ message: 'Friendship not found or already deleted.' });
    }
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Error removing friend', error });
  }
};
