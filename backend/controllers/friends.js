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

    // Check the friend's follow settings (public/private)
    console.log(`Checking follow settings for ${friend_id}`);
    const userSettings = await pool.query(
      'SELECT follow_privacy FROM user_settings WHERE user_id = $1;',
      [friend_id]
    );

    if (userSettings.rows.length === 0) {
      console.error('User settings not found.');
      return res.status(404).json({ message: 'User settings not found.' });
    }

    const followPrivacy = userSettings.rows[0].follow_privacy;

    if(followPrivacy === 'public'){
      // Insert mutual friendship (A -> B and B -> A)
      console.log(`Inserting mutual friendship between ${user_id} and ${friend_id}`);
      const result = await pool.query(
        'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2), ($2, $1);',
        [user_id, friend_id]
      );
      if (result.rowCount === 2) {
        console.log(`Mutual friendship added successfully between ${user_id} and ${friend_id}`);
        res.status(200).json({ message: 'Friendship added successfully.', status: 'followed' });
      } else {
        console.error('Error adding mutual friendship.');
        res.status(500).json({ message: 'Error adding friendship.' });
      }
    } else {
      // Store the request in friend_requests table if account is private
      console.log(`User ${friend_id} has a private account. Storing request.`);
      const requestResult = await pool.query(
        'INSERT INTO friend_requests (requester_id, receiver_id, status) VALUES ($1, $2, $3);',
        [user_id, friend_id, 'pending']
      );

      if (requestResult.rowCount === 1) {
        console.log(`Friend request sent from ${user_id} to ${friend_id}`);
        return res.status(200).json({ message: 'Friend request sent.', status: 'requested' });
      } else {
        console.error('Error adding friend request.');
        return res.status(500).json({ message: 'Error adding friend request.' });
      }
    }
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ message: 'Error adding friend', error });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { request_id, fr_id } = req.body; // Get the friend's ID from the request body
    console.log('Friend ID from request body:', request_id);

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
    console.log(`Checking if friendship exists between ${user_id} and ${request_id}`);
    const existingFriendship = await pool.query(
      'SELECT * FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1);',
      [user_id, request_id]
    );

    if (existingFriendship.rows.length > 0) {
      console.log('Friendship already exists.');
      return res.status(400).json({ message: 'Friendship already exists.' });
    }
    // Insert mutual friendship (A -> B and B -> A)
    console.log(`Inserting mutual friendship between ${user_id} and ${request_id}`);
    const result = await pool.query(
      'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2), ($2, $1);',
      [user_id, request_id]
    );
    if (result.rowCount === 2) {
      console.log(`Mutual friendship added successfully between ${user_id} and ${request_id}`);
      res.status(200).json({ message: 'Friendship added successfully.', status: 'followed' });
    } else {
      console.error('Error adding mutual friendship.');
      res.status(500).json({ message: 'Error adding friendship.' });
    }

    await pool.query('DELETE FROM friend_requests WHERE id = $1', [fr_id]);
  
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
    // Decode the JWT token to get the user_id
    const decodedToken = jwtDecode(token);
    user_id = decodedToken.sub; // Get the user_id from the token
    console.log('Decoded User ID from token:', user_id);
  } catch (err) {
    console.error('Error decoding token:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    // First, check if the user is already friends (in the "friends" table)
    const existingFriend = await pool.query(
      'SELECT * FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1);',
      [user_id, friend_id]
    );

    if (existingFriend.rowCount > 0) {
      // If already friends, proceed with deleting the friendship
      console.log(`Deleting friendship between ${user_id} and ${friend_id}`);
      const result = await pool.query(
        'DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1);',
        [user_id, friend_id]
      );

      if (result.rowCount > 0) {
        console.log(`Friendship deleted between ${user_id} and ${friend_id}`);
        return res.status(200).json({ message: 'Friendship deleted successfully.' });
      } else {
        console.log('No friendship found to delete.');
        return res.status(404).json({ message: 'Friendship not found or already deleted.' });
      }
    }

    // If not friends, check if it's just a pending friend request
    const existingRequest = await pool.query(
      'SELECT * FROM friend_requests WHERE requester_id = $1 AND receiver_id = $2;',
      [user_id, friend_id]
    );

    if (existingRequest.rowCount > 0) {
      // If there is a pending friend request, delete the request
      console.log(`Deleting friend request between ${user_id} and ${friend_id}`);
      const requestDeleteResult = await pool.query(
        'DELETE FROM friend_requests WHERE requester_id = $1 AND receiver_id = $2;',
        [user_id, friend_id]
      );

      if (requestDeleteResult.rowCount > 0) {
        console.log(`Friend request deleted between ${user_id} and ${friend_id}`);
        return res.status(200).json({ message: 'Friend request deleted successfully.' });
      } else {
        console.log('No friend request found to delete.');
        return res.status(404).json({ message: 'Friend request not found or already deleted.' });
      }
    }

    // If no friend or request found, respond with an error
    console.log('No friend or request found between the users.');
    return res.status(404).json({ message: 'No friend or request found to remove.' });

  } catch (error) {
    console.error('Error removing friend or friend request:', error);
    res.status(500).json({ message: 'Error removing friend or friend request', error });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    await pool.query('DELETE FROM friend_requests WHERE id = $1', [requestId]);

    res.json({ message: 'Friend request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
};


export const getFriendRequestStatus = async (req, res) => {
  const { authorId } = req.params;

  try {
    // Use the helper method to extract the user_id from the token
    const userId = extractUserIdFromToken(req);

    // Check if the user is already following
    const followStatus = await pool.query(
      'SELECT * FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [userId, authorId]
    );

    if (followStatus.rowCount > 0) {
      return res.json({ status: 'followed' });
    }

    // Check if there is a pending follow request
    const requestStatus = await pool.query(
      'SELECT * FROM friend_requests WHERE requester_id = $1 AND receiver_id = $2',
      [userId, authorId]
    );

    if (requestStatus.rowCount > 0) {
      return res.json({ status: 'requested' });
    }

    // No follow or request found
    return res.json({ status: 'none' });

  } catch (error) {
    console.error('Error checking follow status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    // Use the helper method to extract the user_id from the token
    const userId = extractUserIdFromToken(req);

    const friendRequests = await pool.query(
      `SELECT fr.*, u.name AS requester_name
       FROM friend_requests fr 
       JOIN users u ON fr.requester_id = u.user_id 
       WHERE fr.receiver_id = $1`,
      [userId]
    );

    res.json(friendRequests.rows);
  } catch (error) {
    console.error('Error checking follow status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


const extractUserIdFromToken = (req) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  let user_id;
  
  if (!token) {
    throw new Error('Token is missing from the authorization header');
  }

  try {
    const decodedToken = jwtDecode(token);
    user_id = decodedToken.sub; // Assuming 'sub' is the user_id
  } catch (err) {
    console.error('Error decoding token:', err); // Log the error for debugging
    throw new Error('Invalid token');
  }

  return user_id;
};