import { jwtDecode } from "jwt-decode";
import { pool } from "../pool.js";
import axios from "axios";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Environment variables
const bucketName = process.env.BUCKET_NAME_FEED;
const profileBucketName = process.env.BUCKET_NAME_PROFILE;
const pythonApiBaseUrl = process.env.PYTHON_API_BASE_URL || "http://localhost:8000";

// Helper function to extract user ID from token
const extractUserIdFromToken = (req) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new Error("Authorization header missing");
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new Error("Token missing from authorization header");
        }

        const decodedToken = jwtDecode(token);
        return decodedToken.sub || decodedToken.user_id; // Adjust based on token structure
    } catch (error) {
        console.error("Token extraction error:", error.message);
        throw new Error("Invalid or missing token");
    }
};

// Fetch recommendations and generate signed image URLs
export const getRecommendations = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req);
        const pythonApiUrl = `${pythonApiBaseUrl}/recommend?user_id=${userId}`;

        const { data } = await axios.get(pythonApiUrl);
        const { recommendations } = data;
        
        if (!recommendations) {
            return res.status(404).json({ error: "No recommendations found" });
        }
        console.log(recommendations);

        const feedWithUrls = await Promise.all(
            (recommendations.feed || []).map(async (feed) => {
                if (feed.image) {
                    const command = new GetObjectCommand({ Bucket: bucketName, Key: feed.image });
                    feed.image = await getSignedUrl(s3, command, { expiresIn: 86400 });
                }
                if (feed.profile) {
                    const command = new GetObjectCommand({ Bucket: profileBucketName, Key: feed.profile });
                    feed.profile = await getSignedUrl(s3, command, { expiresIn: 86400 });
                }
                return feed;
            })
        );

        res.status(200).json({ recommendations: { ...recommendations, feed: feedWithUrls } });
    } catch (error) {
        console.error("Error fetching recommendations:", error.message);
        res.status(500).json({ error: "Failed to fetch recommendations" });
    }
};

// Track user interactions
export const trackInteraction = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req);
        const { postId, engagementType } = req.body;

        if (!postId || !engagementType) {
            return res.status(400).json({ error: "Missing postId or engagementType" });
        }

        await pool.query(
            "INSERT INTO user_engagement (user_id, post_id, engagement_type, created_at) VALUES ($1, $2, $3, NOW())",
            [userId, postId, engagementType]
        );
        res.status(200).json({ message: "Interaction tracked successfully" });
    } catch (error) {
        console.error("Error tracking interaction:", error.message);
        res.status(500).json({ error: "Failed to track interaction" });
    }
};

// Update user login activity
export const updateLogin = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req);
        await pool.query(
            "UPDATE user_activity SET last_login = NOW(), active_sessions = active_sessions + 1 WHERE user_id = $1",
            [userId]
        );
        res.status(200).json({ message: "Login updated successfully" });
    } catch (error) {
        console.error("Error updating login:", error.message);
        res.status(500).json({ error: "Failed to update login" });
    }
};

// Fetch user preferences
export const fetchUserPreferences = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req);
        const result = await pool.query(
            "SELECT preferred_categories, search_history, click_history FROM user_preferences WHERE user_id = $1",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User preferences not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching user preferences:", error.message);
        res.status(500).json({ error: "Failed to fetch user preferences" });
    }
};

// Fetch user engagement history
export const fetchUserEngagement = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req);
        const result = await pool.query(
            "SELECT post_id, engagement_type FROM user_engagement WHERE user_id = $1",
            [userId]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching user engagement:", error.message);
        res.status(500).json({ error: "Failed to fetch user engagement" });
    }
};

// Fetch user's social graph
export const fetchSocialGraph = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req);
        const result = await pool.query(
            "SELECT friend_id, connection_strength FROM user_social_graph WHERE user_id = $1",
            [userId]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching user social graph:", error.message);
        res.status(500).json({ error: "Failed to fetch user social graph" });
    }
};

// Fetch user activity history
export const fetchActivityHistory = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req);
        const result = await pool.query(
            "SELECT last_login, last_interaction, active_sessions FROM user_activity WHERE user_id = $1",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User activity history not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching user activity history:", error.message);
        res.status(500).json({ error: "Failed to fetch user activity history" });
    }
};
