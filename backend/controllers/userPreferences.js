import { pool } from '../pool.js'; 
import { jwtDecode } from "jwt-decode";

export const getUserSettings = async (req, res) => {
    try {
      let user_id;
      
      try {
        user_id = extractUserIdFromToken(req); // Use the helper function
      } catch (error) {
        console.error('Error extracting user ID:', error.message);
        return res.status(401).json({ message: error.message });
      }
  
      console.log("Extracted user ID:", user_id); // Debugging log
  
      const result = await pool.query(
        `SELECT privacy_level, email_notifications, push_notifications, 
                language, theme, timezone, user_interests, follow_privacy
         FROM user_settings WHERE user_id = $1;`,
        [user_id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User settings not found.' });
      }
  
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ message: 'Error fetching user settings', error: error.message });
    }
  };
  
  
  export const updateUserSettings = async (req, res) => {
    try {
      const { privacy_level, email_notifications, push_notifications, language, theme, timezone, user_interests, follow_privacy } = req.body;
  
      let user_id;
      try {
        user_id = extractUserIdFromToken(req); // Use the helper function
      } catch (error) {
        console.error('Error extracting user ID:', error.message);
        return res.status(401).json({ message: error.message });
      }
  
      const result = await pool.query(
        `UPDATE user_settings 
         SET privacy_level = $1, email_notifications = $2, push_notifications = $3, 
             language = $4, theme = $5, timezone = $6, user_interests = $7, follow_privacy = $8
         WHERE user_id = $9;`,
        [privacy_level, email_notifications, push_notifications, language, theme, timezone, user_interests, follow_privacy, user_id]
      );
  
      if (result.rowCount > 0) {
        res.status(200).json({ message: 'User settings updated successfully' });
      } else {
        res.status(404).json({ message: 'User settings not found' });
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
      res.status(500).json({ message: 'Error updating user settings', error: error.message });
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