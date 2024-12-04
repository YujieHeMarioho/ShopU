import pool from '../pool.js';

  export const getPolicies = async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM privacy_settings WHERE user_id = $1;', 
    [user_id]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting privacy settings:', error);
    res.status(500).json({ message: 'Error getting privacy settings', error });
  }
};

export const addDefualtPolicies = async (req, res) => {
  try {
    const { user_id } = req.body;
    const result = await pool.query('INSERT INTO privacy_settings (user_id, allow_friend_requests, updated_at) VALUES ($1, $2, $3);',
       [user_id, true, new Date().toISOString()]);
       
    res.status(200).json({ message: 'Privacy setting added successfully.'});
  } catch (error) {
    console.error('Error adding privacy setting:', error);
    res.status(500).json({ message: 'Error adding privacy setting', error });
  }
};

export const updatePolicies = async (req, res) => {
  const { user_id, allow_friend_request } = req.body;

  if (typeof allow_friend_request !== 'boolean') {
    return res.status(400).json({ message: 'Invalid value for allow_friend_request. It must be a boolean.' });
  }

  try {
    const result = await pool.query('UPDATE privacy_settings SET allow_friend_requests = $1, updated_at=$2 WHERE user_id = $3;', 
    [allow_friend_request, new Date().toISOString(), user_id]);

    if (result.rowCount > 0){
      res.status(200).json({ message: 'Security setting updated successfully.'});
    }

    if (result.rowCount === 0){
      res.status(404).json({ message: 'Security setting not found'});
    }
    
  } catch (error) {
    console.error('Error removing security setting:', error);
    res.status(500).json({ message: 'Error removing security setting', error });
  }
};

export default {getPolicies, addDefualtPolicies, updatePolicies};