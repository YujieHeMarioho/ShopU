import pool from '../pool.js';
import axios from 'axios';
import qs from 'qs';
import { jwtDecode } from "jwt-decode";

// Your Auth0 domain and client credentials
const auth0URL = process.env.AUTH0_ISSUER_BASE_URL;
const clientId = process.env.AUTH0_CLIENT_ID;
const clientSecret = process.env.AUTH0_CLIENT_SECRET;
const audience = process.env.AUTH0_AUDIENCE;

// Get All Users
export const getAllAuth0Users = async (req, res) => {
    const { user_id } = req.params;

    try {
        const accessToken = await getManagementApiAccessToken();
        const response = await axios.get(
          `${audience}users`,
        {
          headers: {
              'Authorization': `Bearer ${accessToken}`,
          }
        });
        res.status(200).json(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error });
      }
};
  
export const getUserInfo =  async (req, res) => {
  const { user_id } = req.params;

  try {
    const accessToken = await getManagementApiAccessToken();
    const response = await axios.get(
      `${audience}users/${user_id}`,
    {
      headers: {
          'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (response.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Error fetching user details', error });
  }
};
  
// Save or Update user
export const updateUser =  async (req, res) => {
    const { email, name, picture } = req.body;
    const updatedDataJson = { email, name, picture }; // This is the data to update

    let userId;
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    try {
        const decodedToken = jwtDecode(token); // Decode the token
        userId = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    try {
      const accessToken = await getManagementApiAccessToken();

      // You can now use this token to make further API requests to Auth0's Management API
      const response = ManagementApiUpdateUser(accessToken, userId, updatedDataJson); 
  
        res.status(200).json({ message: 'Updated user successfully', accessToken });
      } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user', error });
      }
};
  
// Save or Update user
export const createUser =  async (req, res) => {
    const { user_id} = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE user_id = $1', [user_id]);
        if (result.rowCount > 0) {
            return res.status(200).json({ message: 'User already exists', user: result.rows[0]});
        }

        // If the user doesn't exist then create them by saving their id into the db

        // Generate the created_at timestamp
        const created_at = new Date().toISOString(); // Current timestamp in ISO format
        const newUser = await pool.query(
            'INSERT INTO users (create_date, user_id) VALUES ($1, $2) RETURNING *',
            [created_at, user_id]
          );

        res.status(201).json({ message: 'User created successfully', user: newUser.rows[0] });
      } catch (error) {
        
        // Handle errors including duplicate key violation
        if (error.code === '23505') {  // 23505 is the error code for a duplicate key violation in PostgreSQL
            return res.status(400).json({ message: 'User already exists' });
        }
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user', error });
      }
};
  
async function getManagementApiAccessToken() {
  try {
    const response = await axios.post(`${auth0URL}/oauth/token`, qs.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: audience,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
    return response.data.access_token; 
  } catch (error) {
    console.error('Error getting access token:', error);
    throw new Error('Failed to get access token');
  }
}

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
        console.error('Error updating user:', error.response ? error.response.data : error);
        throw new Error('Failed to update user');
    }
  }

export default {updateUser, getAllAuth0Users, createUser, getUserInfo};