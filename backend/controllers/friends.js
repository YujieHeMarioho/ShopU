import pool from '../pool.js';

  export const getFriends = async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM friends where user_id = $1;', user_id);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({ message: 'Error getting friends', error });
  }
};

// currently we are thinking users will have a privacy policy that allows or doesn't allow follows. 
export const addFriend = async (req, res) => {
  try {
    const { user_id, friend_id } = req.body;
    
    // Check if the user and friend both allow friend requests
    const userPrivacyResult = await pool.query('SELECT allow_friend_requests FROM privacy_settings WHERE user_id = $1;', 
      [user_id]);

    const friendPrivacyResult = await pool.query('SELECT allow_friend_requests FROM privacy_settings WHERE friend_id = $1;', 
      [friend_id]);

    // If either user does not allow friend requests, return an error
    if(!userPrivacyResult.rows.length || !friendPrivacyResult.rows.length){
      return res.status(404).json({ message: 'Privacy settings not found for one or both users.' });
    }

    const userAllowFriendRequests = userPrivacyResult.rows[0].allow_friend_requests;
    const friendAllowFriendRequests = friendPrivacyResult.rows[0].allow_friend_requests;

    if (!userAllowFriendRequests || !friendAllowFriendRequests) {
      return res.status(403).json({ message: 'One or both users do not allow friend requests.' });
    }

    // Check if the friendship already exists
    const existingFriendship = await pool.query(
      'SELECT * FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1);',
      [user_id, friend_id]
    );

    if (existingFriendship.rows.length > 0) {
      return res.status(400).json({ message: 'Friendship already exists.'});
    }

    const result = await pool.query('INSERT INTO friends (user_id, friend_id, friended_at) VALUES ($1, $2, $3);',    
      [user_id, friend_id, new Date().toISOString()]);

    if(result.rowCount > 0 ){
      res.status(200).json({ message: 'Friendship added successfully.'});
    } else {
      res.status(500).json({ message: 'Error adding friendship.'});
    }
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ message: 'Error adding friend', error });
  }
};

export const deleteFriend = async (req, res) => {
  const { user_id, friend_id } = req.params;

  try {
    const result = await pool.query('DELETE FROM friends where user_id = $1 and friend_id = $2;', 
    [user_id, friend_id]);

    if (result.rowCount > 0){
      res.status(200).json({ message: 'Friendship deleted successfully.'});
    }

    if (result.rowCount === 0){
      res.status(404).json({ message: 'Friendship not found or already deleted'});
    }

  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Error removing friend', error });
  }
};


export default {getFriends, addFriend, deleteFriend};