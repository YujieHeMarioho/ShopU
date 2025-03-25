import { jwtDecode } from "jwt-decode";
import { pool } from '../pool.js'; 
import axios from 'axios';

// Method to extract user ID from the token
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

  export const getRecommendations = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req) // Get user_id from the query parameter
        const pythonApiUrl = `http://localhost:8000/recommend?user_id=${userId}`;

        // Fetch recommendations from Python server
        const response = await axios.get(pythonApiUrl);

        // Get the recommended listings and feed posts from Python server response
        const recommendations = response.data.recommendations;
        console.log(recommendations);
        
        // Now fetch images and other details for each listing and feed post
        const feedWithUrls = await Promise.all(
            recommendations.feed.map(async (feed) => {
                // Fetch the pre-signed URL for the image file_key (if it exists)
                if (feed.image) {
                    const command = new GetObjectCommand({
                        Bucket: bucketName,
                        Key: feed.image,
                    });
                    feed.image = await getSignedUrl(s3, command, { expiresIn: 86400 });
                }

                if (feed.profile) {
                    const command = new GetObjectCommand({
                        Bucket: profileBucketName,
                        Key: feed.profile,
                    });
                    feed.profile = await getSignedUrl(s3, command, { expiresIn: 86400 });
                }

                // Return the modified feed post
                return feed;
            })
        );

        // Return the updated recommendations with URLs to the frontend
        res.status(200).json({ recommendations: { ...recommendations, feed: feedWithUrls } });
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        res.status(500).json({ error: "Failed to fetch recommendations" });
    }
};



export const trackInteraction = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req); // Extract userId from token
        const { postId, engagementType } = req.body;
        await pool.query(
            "INSERT INTO user_engagement (user_id, post_id, engagement_type, created_at) VALUES ($1, $2, $3, NOW()) ",
            [userId, postId, engagementType]
        );
        res.json({ message: "Interaction tracked successfully" });
    } catch (error) {
        console.error("Error tracking interaction:", error);
        res.status(500).json({ error: "Failed to track interaction" });
    }
};

export const updateLogin = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req); // Extract userId from token
        
        await pool.query(
            "UPDATE user_activity SET last_login = NOW(), active_sessions = active_sessions + 1 WHERE user_id = $1",
            [userId]
        );
        res.json({ message: "Login updated successfully" });
    } catch (error) {
        console.error("Error updating login:", error);
        res.status(500).json({ error: "Failed to update login" });
    }
};

export const fetchUserPreferences = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req); // Extract userId from token
        const result = await pool.query(
            "SELECT preferred_categories, search_history, click_history FROM user_preferences WHERE user_id = $1",
            [userId]
        );
        res.json(result.rows[0] || {});
    } catch (error) {
        console.error("Error fetching user preferences:", error);
        res.status(500).json({ error: "Failed to fetch user preferences" });
    }
};

export const fetchUserEngagement = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req); // Extract userId from token
        const result = await pool.query(
            "SELECT post_id, engagement_type FROM user_engagement WHERE user_id = $1",
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching user engagement:", error);
        res.status(500).json({ error: "Failed to fetch user engagement" });
    }
};

export const fetchSocialGraph = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req); // Extract userId from token
        const result = await pool.query(
            "SELECT friend_id, connection_strength FROM user_social_graph WHERE user_id = $1",
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching user social graph:", error);
        res.status(500).json({ error: "Failed to fetch user social graph" });
    }
};

export const fetchActivityHistory = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req); // Extract userId from token
        const result = await pool.query(
            "SELECT last_login, last_interaction, active_sessions FROM user_activity WHERE user_id = $1",
            [userId]
        );
        res.json(result.rows[0] || {});
    } catch (error) {
        console.error("Error fetching user activity history:", error);
        res.status(500).json({ error: "Failed to fetch user activity history" });
    }
};
