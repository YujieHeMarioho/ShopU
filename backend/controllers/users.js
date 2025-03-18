import { pool, buckets, s3 } from '../pool.js';
import axios from 'axios';
import qs from 'qs';
//correct with import 
import { jwtDecode } from "jwt-decode";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Your Auth0 domain and client credentials
const auth0URL = process.env.AUTH0_ISSUER_BASE_URL;
const clientId = process.env.AUTH0_CLIENT_ID;
const clientSecret = process.env.AUTH0_CLIENT_SECRET;
const audience = process.env.AUTH0_AUDIENCE;

// S3 Bucket Params
const bucketName = buckets.profile;

// Get All Users
export const getAllAuth0Users = async (req, res) => {
  try {
    const accessToken = await getManagementApiAccessToken();
    const response = await axios.get(
      `${audience}users`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching users:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get the total number of users on the platform
export const getUserCount = async (req, res) => {
  const query = `SELECT COUNT(*) AS total_users FROM users;`;

  try {
    const result = await pool.query(query);
    res.status(200).json({ total_users: result.rows[0].total_users });
  } catch (err) {
    console.error('Error running query:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const getUserSearch = async (req, res) => {
  const { query } = req.query; // Get the search query from request parameters

  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
  }

  const searchQuery = `
    SELECT user_id, name
    FROM users
    WHERE 
      name ILIKE $1
    LIMIT 12;
  `;

  try {
    const result = await pool.query(searchQuery, [`%${query}%`]);
    const users = result.rows.map(user => ({
      id: user.user_id,
      name: user.name,
    }));

    res.status(200).json(users);
  } catch (err) {
    console.error('Error running query:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// Get User Info
export const getUserInfo = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = 'SELECT name, create_date, profile_image, email FROM users WHERE user_id = $1';
    const result = await pool.query(query, [user_id]);

    if (result.rows && result.rows.length > 0) {
      let { name, create_date, profile_image, email } = result.rows[0];
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: profile_image,
      });

      // Generate the signed URL
      const imageURL = await getSignedUrl(s3, command, { expiresIn: 86400 });
      profile_image = imageURL;

      res.status(200).json({
        name: name || 'Unnamed User',
        email: email || 'No Email Provided', // Return email
        picture: profile_image || 'https://via.placeholder.com/40', // Fallback image
        create_date: create_date,
      });
    } else {
      res.status(404).json({ message: 'results not found'});
    }
  } catch (error) {
    console.error('Error fetching user details:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
};

// Get User Info getUserInfoFromAuth0
export const getUserInfoFromAuth0 = async (req, res) => {
  const { user_id } = req.params;

  try {
    const accessToken = await getManagementApiAccessToken();
    const response = await axios.get(
      `${audience}users/${encodeURIComponent(user_id)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Check if user data is present
    if (!response.data) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract necessary fields
    const { nickname, name, picture, email } = response.data; // Include email

    const query = 'SELECT * FROM users WHERE user_id = $1';
    const result = await pool.query(query, [user_id]);
   
    let create_date, profile_image;
    if(result.rows.length > 0)
    {
      ({ create_date, profile_image } = result.rows[0]);
      
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: profile_image,
      });

      // Generate the signed URL
      const imageURL = await getSignedUrl(s3, command, { expiresIn: 86400 });
      profile_image = imageURL;
    }
    else{
      res.status(500).json({ message: 'Error fetching user details', error: error.message });
    }
    
    res.status(200).json({
      name: name || 'Unnamed User',
      email: email || 'No Email Provided', // Return email
      picture: profile_image || 'https://via.placeholder.com/40', // Fallback image
      create_date: create_date,
    });
  } catch (error) {
    console.error('Error fetching user details:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
};

// Get User Info
export const getCurrentUserInfo = async (req, res) => {
  const query = 'SELECT * FROM users WHERE user_id = $1';

  try {
    const userId = extractUserIdFromToken(req); // Extract user ID from token
    const result = await pool.query(query, [userId]);

    const imageKey = result.rows[0]?.profile_image;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: imageKey,
    });

    // Generate the signed URL
    const imageURL = await getSignedUrl(s3, command, { expiresIn: 86400 });

    result.rows[0].profile_image = imageURL;

    res.json(result.rows[0]);

  } catch (error) {
      console.error('Error running query:', err);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
};

// Update User
export const updateUser = async (req, res) => {
  const { email, name, picture } = req.body;
  let updatedDataJson = { email, name }; // This is the data to update

  let userId;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) {
    console.error('No authorization token provided');
    return res.status(401).json({ message: 'No authorization token provided' });
  }
  try {
    const decodedToken = jwtDecode(token); // Decode the token
    userId = decodedToken.sub;
  } catch (err) {
    console.error('Error decoding token:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    if (picture != null) {
      const currentImageQuery = `SELECT profile_image from users WHERE user_id = $1;`
      const result = await pool.query(currentImageQuery, [userId]);
      const oldImage = result.rows[0]?.profile_image;

      if (oldImage != 'blank-profile-picture-973460_1280.png'){
        try{
          const params = {
            "Bucket": bucketName,
            "Key": oldImage
          };
    
          await s3.send(new DeleteObjectCommand(params));
        }catch (error){
          console.error('Error updating user, failed to delete old image:', error.response ? error.response.data : error.message);
          res.status(500).json({ message: 'Error updating user, failed to delete old image', error: error.message });
        }
      }
      
      const updatePictureQuery = `UPDATE users SET profile_image = $1 WHERE user_id = $2;`;
      await pool.query(updatePictureQuery, [picture, userId]);
    }

    const accessToken = await getManagementApiAccessToken();

    // You can now use this token to make further API requests to Auth0's Management API
    const response = await ManagementApiUpdateUser(accessToken, userId, updatedDataJson);
    // Added 'await' since ManagementApiUpdateUser is async

    const query = `UPDATE users SET name = $1, SET email = $2 WHERE user_id = $3;`;
    const updateUsersName = await pool.query(query, [name, email, userId]);

    res.status(200).json({ message: 'Updated user successfully', accessToken });
  } catch (error) {
    console.error('Error updating user:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Create User
export const createUser = async (req, res) => {
  const { user_id, email, name } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (result.rowCount > 0) {
      return res.status(200).json({ message: 'User already exists', user: result.rows[0] });
    }

    // If the user doesn't exist then create them by saving their id into the db

    // Generate the created_at timestamp
    const created_at = new Date().toISOString(); // Current timestamp in ISO format
    const newUser = await pool.query(
      'INSERT INTO users (user_id, create_date, name, profile_image, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, created_at, name, 'blank-profile-picture-973460_1280.png', email]
    );

    // Auto-populate default user settings
    await pool.query(
      `INSERT INTO user_settings (
        user_id, privacy_level, email_notifications, push_notifications, 
        language, theme, timezone, user_interests, follow_privacy
       ) VALUES ($1, 'public', true, true, 'English', 'light', 'UTC', ARRAY[]::text[], 'public')
       ON CONFLICT (user_id) DO NOTHING;`,
      [user_id]
    );

    res.status(201).json({ message: 'User created successfully', user: newUser.rows[0] });
  } catch (error) {
    // Handle errors including duplicate key violation
    if (error.code === '23505') {  // 23505 is the error code for a duplicate key violation in PostgreSQL
      return res.status(400).json({ message: 'User already exists' });
    }
    console.error('Error creating user:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// Get Management API Access Token
async function getManagementApiAccessToken() {
  try {
    const response = await axios.post(`${auth0URL}/oauth/token`, qs.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: audience,
      scope: 'read:users', // Ensure this line is present
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get access token');
  }
}

// Update User via Management API
async function ManagementApiUpdateUser(accessToken, userId, updatedDataJson) {
  try {
    const response = await axios.patch(
      `${audience}users/${userId}`,
      updatedDataJson,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

    return response;
  } catch (error) {
    console.error('Error updating user:', error.response ? error.response.data : error.message);
    throw new Error('Failed to update user');
  }
}

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    //Create unique image names so no collusion within the bucket
    const fileName = `${uuidv4()}-${req.file.originalname}`;

    //upload params 
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    // Upload to S3
    await s3.send(new PutObjectCommand(params));

    res.status(200).json({
      message: "Files uploaded successfully",
      fileKey: fileName,
    });
  } catch (err) {
    console.error("Error uploading images:", err);
    res.status(500).json({ message: "Error uploading files", error: err });
  }
}

export const getProfilePicture = async (req, res) => {
  const userID = req.params.user_id;

  try {
    const query = `SELECT profile_image FROM users WHERE user_id = $1;`
    const result = await pool.query(query, [userID]);
    const imageKey = result.rows[0]?.profile_image;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: imageKey,
    });
  
    // Generate the signed URL
    const imageURL = await getSignedUrl(s3, command, { expiresIn: 86400 });
    res.status(200).json(imageURL);
  }catch (error){
    console.error("Error Retrieving Images:", error.message);
    res.status(500).json({ message: "Error Retrieving Profile Image", error: error.message });
  }
}

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

export default { updateUser, getAllAuth0Users, createUser, getUserInfo, getUserSearch, getCurrentUserInfo };
