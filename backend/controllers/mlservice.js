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

// Utility function that inserts the view if it doesn't already exist
export const insertViewIfNotExists = async (tableName, userId, idColumn, itemId) => {
    const query = `
      INSERT INTO ${tableName} (user_id, ${idColumn})
      VALUES ($1, $2)
      ON CONFLICT (user_id, ${idColumn}) DO NOTHING;
    `;
    await pool.query(query, [userId, itemId]);
  };
  
// Express route handler
export const handleInsertView = async (req, res) => {
    console.log("Insert view called");
  
    try {
      // Extract user ID from token
      const userId = extractUserIdFromToken(req);
      
      // Get the listing_id or post_id from query parameters
      const { listing_id, post_id } = req.query;
  
      // Ensure userId and either listing_id or post_id are present
      if (!userId || (!listing_id && !post_id)) {
        return res.status(400).json({ error: 'Missing user ID or item ID' });
      }
  
      // Insert view depending on whether listing_id or post_id is provided
      if (listing_id) {
        await insertViewIfNotExists('user_listing_viewed', userId, 'listing_id', listing_id);
      } else if (post_id) {
        await insertViewIfNotExists('user_post_viewed', userId, 'post_id', post_id);
      }
  
      // Respond with success message
      res.status(200).json();
  
    } catch (error) {
      // Log error and return internal server error response
      console.error('Error inserting view:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  

// Fetch recommendations and generate signed image URLs
export const getRecommendations = async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req);
        const currentPage = req.query.current_page || 'feed';
        const pythonApiUrl = `${pythonApiBaseUrl}/recommend?user_id=${userId}&current_page=${currentPage}`;

        const { data } = await axios.get(pythonApiUrl);
        const { listing_recommendations, feed_recommendations } = data;
        
        if (!listing_recommendations && !feed_recommendations) {
            return res.status(404).json({ error: "No recommendations found" });
        }

        console.log("Listing Recommendations:", listing_recommendations);
        console.log("Feed Recommendations:", feed_recommendations);

        // Process feed posts with URLs (signed URLs for images and profiles)
        const feedWithUrls = await Promise.all(
            (feed_recommendations || []).map(async (feed) => {
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

        // Respond with recommendations, including processed feed URLs
        res.status(200).json({
            recommendations: {
                listing_recommendations, // Send the listing recommendations directly
                feed_recommendations: feedWithUrls // Send the processed feed recommendations
            }
        });
    } catch (error) {
        console.error("Error fetching recommendations:", error.message);
        res.status(500).json({ error: "Failed to fetch recommendations" });
    }
};