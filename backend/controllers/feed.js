import pool from '../pool.js';
import { jwtDecode } from 'jwt-decode';

// Helper function to extract user_id from the token
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

// Fetch all feed posts
export const getAllFeedPosts = async (req, res) => {
  try {
    const userId = extractUserIdFromToken(req); // Extract user ID from token

    const query = `
      SELECT
        f.post_id,
        f.title,
        f.content,
        f.image_url,
        f.date_created,
        u.user_id AS author,
        f.likes_count,
        ARRAY_AGG(t.tag_name) AS tags, -- Aggregate tags into an array
        EXISTS (
            SELECT 1
            FROM post_likes pl
            WHERE pl.post_id = f.post_id AND pl.user_id = $1
        ) AS isLiked -- Check if the current user liked the post
      FROM
          feed_posts f
      JOIN
          users u ON f.user_id = u.user_id
      LEFT JOIN
          post_tags pt ON f.post_id = pt.post_id -- Join with post_tags
      LEFT JOIN
          tags t ON pt.tag_id = t.tag_id -- Join with tags
      GROUP BY
          f.post_id, u.user_id -- Group by post and user to aggregate tags
      ORDER BY
          f.date_created DESC;
    `;

    // Execute the query
    const result = await pool.query(query, [userId]);

    if (result.rowCount === 0) {
      console.log('No feed posts found.');
    }

    // Respond with the results
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching feed posts:', err.message); // Log specific error message
    res.status(500).json({ error: err.message || 'Database error' });
  }
};




export const likeFeedPost = async (req, res) => {
  const { id } = req.params;

  try {
    const userId = extractUserIdFromToken(req); // Extract user ID from token

    // Check if the post is already liked by the user
    const likeCheckQuery = 'SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2';
    const likeCheckResult = await pool.query(likeCheckQuery, [userId, id]);

    if (likeCheckResult.rowCount > 0) {
      // User has liked the post, so we remove the like (unlike)
      const removeLikeQuery = 'DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2';
      await pool.query(removeLikeQuery, [userId, id]);

      const updateLikeCountQuery = `
        UPDATE feed_posts
        SET likes_count = likes_count - 1
        WHERE post_id = $1
        RETURNING likes_count;
      `;
      const updateResult = await pool.query(updateLikeCountQuery, [id]);
      const newLikeCount = updateResult.rows[0].likes_count;

      return res.status(200).json({ success: true, likeCount: newLikeCount, isLiked: false });
    } else {
      // User hasn't liked the post, so we add a like
      const addLikeQuery = 'INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)';
      await pool.query(addLikeQuery, [userId, id]);

      const updateLikeCountQuery = `
        UPDATE feed_posts
        SET likes_count = likes_count + 1
        WHERE post_id = $1
        RETURNING likes_count;
      `;
      const updateResult = await pool.query(updateLikeCountQuery, [id]);
      const newLikeCount = updateResult.rows[0].likes_count;

      return res.status(200).json({ success: true, likeCount: newLikeCount, isLiked: true });
    }
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({ error: 'Failed to toggle like status' });
  }
};


// Fetch feed posts for a specific user
export const getUserFeedPosts = async (req, res) => {
  const { userId } = req.params; // Assuming userId is still passed for other functionalities
  const query = `
    SELECT
      f.post_id,
      f.title,
      f.content,
      f.image_url,
      f.date_created
    FROM
      feed_posts f
    WHERE
      f.user_id = $1
    ORDER BY f.date_created DESC;
  `;

  try {
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching user feed posts:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// Create a new feed post
export const createFeedPost = async (req, res) => {
  const { title, content, imageUrl } = req.body;

  try {
    const userId = extractUserIdFromToken(req); // Extract user_id from token
    const query = `
      INSERT INTO feed_posts (title, content, image_url, user_id, date_created)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;

    const result = await pool.query(query, [title, content, imageUrl, userId]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating feed post:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// Delete a feed post by ID
export const deleteFeedPost = async (req, res) => {
  const { postId } = req.params;

  const query = `
    DELETE FROM feed_posts
    WHERE post_id = $1
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [postId]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Post not found' });
    } else {
      res.status(200).json({ message: 'Post deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting feed post:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// Update a feed post by ID
export const updateFeedPost = async (req, res) => {
  const { postId } = req.params;
  const { title, content, imageUrl } = req.body;

  const query = `
    UPDATE feed_posts
    SET title = $1, content = $2, image_url = $3, date_created = NOW()
    WHERE post_id = $4
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [title, content, imageUrl, postId]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Post not found' });
    } else {
      res.status(200).json(result.rows[0]);
    }
  } catch (err) {
    console.error('Error updating feed post:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const shareFeedPost = async (req, res) => {
  const { postId } = req.params; // ID of the post being shared
  const { receiverId } = req.body; // ID of the user to receive the shared post

  try {
    // Extract the sender's user ID from the token
    const senderId = extractUserIdFromToken(req);

    // Transaction to ensure atomicity
    await pool.query('BEGIN');

    // Step 1: Insert into the messages or notifications table
    const insertMessageQuery = `
      INSERT INTO messages (sender_id, receiver_id, content, message_type, created_at)
      VALUES ($1, $2, $3, 'post_share', NOW())
      RETURNING *;
    `;

    const postLink = `/posts/${postId}`; // Link to the shared post
    const messageResult = await pool.query(insertMessageQuery, [senderId, receiverId, postLink]);

    // Step 2: Update the share count of the post
    const updateShareCountQuery = `
      UPDATE feed_posts
      SET share_count = share_count + 1
      WHERE post_id = $1
      RETURNING *;
    `;

    const postResult = await pool.query(updateShareCountQuery, [postId]);

    if (postResult.rowCount === 0) {
      throw new Error('Post not found');
    }

    // Commit the transaction
    await pool.query('COMMIT');

    // Return success response
    res.status(201).json({
      message: 'Post shared successfully',
      sharedPost: postResult.rows[0],
      notification: messageResult.rows[0],
    });
  } catch (err) {
    // Rollback transaction in case of error
    await pool.query('ROLLBACK');
    console.error('Error sharing feed post:', err);
    res.status(500).json({ error: 'An error occurred while sharing the post' });
  }
};
