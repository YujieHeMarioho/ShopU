import { s3, pool, buckets } from '../pool.js';
import { jwtDecode } from 'jwt-decode';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const bucketName = buckets.feed;

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
        f.image_url as profile,
        fi.file_key as image,
        f.date_created,
        u.NAME AS author,
        u.user_id AS author_id,
        f.likes_count,
        f.listing_id,
        COALESCE(ARRAY_AGG(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), ARRAY[]::TEXT[]) AS tags,
        EXISTS (
            SELECT 1
            FROM post_likes pl
            WHERE pl.post_id = f.post_id AND pl.user_id = $1
        ) AS isLiked -- Check if the current user liked the post
      FROM
          feed_posts f
      JOIN
          users u ON f.user_id = u.user_id
      JOIN
          post_images fi ON f.post_id = fi.post_id
      LEFT JOIN
          post_tags pt ON f.post_id = pt.post_id -- Join with post_tags
      LEFT JOIN
          tags t ON pt.tag_id = t.tag_id -- Join with tags
      GROUP BY
          f.post_id, u.user_id, fi.file_key -- Group by post and user to aggregate tags
      ORDER BY
          f.date_created DESC;
    `;


    // Execute the query
    const result = await pool.query(query, [userId]);

    const feedWithUrls = await Promise.all(
      result.rows.map(async (feed) => {
          // Generate a pre-signed URL for the image file_key (if it exists)
          if (feed.image) {
              const command = new GetObjectCommand({
                  Bucket: bucketName,
                  Key: feed.image,
              });
  
              // Generate the signed URL
              feed.image = await getSignedUrl(s3, command, { expiresIn: 86400 });
          }
  
          // Return the modified row
          return feed;
       })
    );

    if (feedWithUrls.rowCount === 0) {
      console.log('No feed posts found.');
    }

    // Respond with the results
    res.status(200).json(feedWithUrls);
  } catch (err) {
    console.error('Error fetching feed posts:', err.message); // Log specific error message
    res.status(500).json({ error: err.message || 'Database error' });
  }
};

//Endpoint to get the total number of active posts in the feed
export const getFeedPostCount = async (req, res) => {
  const query = `SELECT COUNT(*) AS total_feed_posts FROM feed_posts;`;

  try {
    const result = await pool.query(query);
    res.status(200).json({ total_feed_posts: result.rows[0].total_feed_posts });
  } catch (err) {
    console.error('Error running query:', err);
    res.status(500).json({ error: 'Database error' });
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


export const getUserFeedPosts = async (req, res) => {
  try {
    const userId = extractUserIdFromToken(req); // Extract user ID from token
    const query = `
       SELECT
        f.post_id,
        f.title,
        f.content,
        f.image_url as profile,
        fi.file_key as image,
        f.date_created,
        u.NAME AS author,
        u.user_id AS author_id,
        f.likes_count,
        f.listing_id,
        COALESCE(ARRAY_AGG(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), ARRAY[]::TEXT[]) AS tags,
        EXISTS (
            SELECT 1
            FROM post_likes pl
            WHERE pl.post_id = f.post_id AND pl.user_id = $1
        ) AS isLiked -- Check if the current user liked the post
      FROM
          feed_posts f
      JOIN
          users u ON f.user_id = u.user_id
      JOIN
          post_images fi ON f.post_id = fi.post_id
      LEFT JOIN
          post_tags pt ON f.post_id = pt.post_id -- Join with post_tags
      LEFT JOIN
          tags t ON pt.tag_id = t.tag_id -- Join with tags
      WHERE
        f.user_id = $1
      GROUP BY
          f.post_id, u.user_id, fi.file_key -- Group by post and user to aggregate tags
      ORDER BY
          f.date_created DESC;
    `;

    // Execute the query
    const result = await pool.query(query, [userId]);

    const feedWithUrls = await Promise.all(
      result.rows.map(async (feed) => {
          // Generate a pre-signed URL for the image file_key (if it exists)
          if (feed.image) {
              const command = new GetObjectCommand({
                  Bucket: bucketName,
                  Key: feed.image,
              });
  
              // Generate the signed URL
              feed.image = await getSignedUrl(s3, command, { expiresIn: 86400 });
          }
  
          // Return the modified row
          return feed;
       })
    );

    if (feedWithUrls.length === 0) {
      console.log('No posts found for this user.');
    }

    // Respond with the results
    res.status(200).json(feedWithUrls);
  } catch (err) {
    console.error('Error fetching user feed posts:', err.message); // Log specific error message
    res.status(500).json({ error: err.message || 'Database error' });
  }
};

export const getUserFeedPostsCount = async (req, res) => {
  try {
    const userId = extractUserIdFromToken(req); // Extract user ID from token

    const query = `
      SELECT COUNT(*) AS post_count
      FROM feed_posts f
      WHERE f.user_id = $1;
    `;

    // Execute the query
    const result = await pool.query(query, [userId]);

    const postCount = result.rows[0].post_count;

    // Respond with the count
    res.status(200).json({ count: postCount });
  } catch (err) {
    console.error('Error fetching user feed posts count:', err.message); // Log specific error message
    res.status(500).json({ error: err.message || 'Database error' });
  }
};


// Create a new feed post  (TODO Need to handle linking to items)
export const createFeedPost = async (req, res) => {
  const { title, content, tags, image } = req.body;
  //Image is the actual image uploaded no the profile picture 
  
  try {
    const userId = extractUserIdFromToken(req); // Extract user_id from token

    // Begin a transaction
    await pool.query("BEGIN");

    // Insert the post into the feed_posts table
    const postQuery = `
      INSERT INTO feed_posts (title, content, image_url, user_id, date_created, listing_id)
      VALUES ($1, $2, $3, $4, NOW(), $5)
      RETURNING post_id;
    `;

    let postListingId = null;

    if(req.body.listingId != null)
    {
      postListingId = req.body.listingId;
    }

    //will need to replace the placeholder with profile image, will get to that later 
    const postResult = await pool.query(postQuery, [title, content, 'https://via.placeholder.com/300x200', userId, postListingId]);
    const postId = postResult.rows[0].post_id;

    // Inserts image into the post_image table
    const imgQuery = `
    INSERT INTO post_images (post_id, file_key)
    VALUES ($1, $2)
    `;

    await pool.query(imgQuery, [postId, image]);

    // Split tags and handle each tag
    const tagList = tags.split(",").map(tag => tag.trim()); // Split and trim tags
    for (const tag of tagList) {
      // Insert the tag into the tags table if it doesn't already exist
      const tagQuery = `
        INSERT INTO tags (tag_name)
        VALUES ($1)
        ON CONFLICT (tag_name) DO NOTHING
        RETURNING tag_id;
      `;
      const tagResult = await pool.query(tagQuery, [tag]);

      // Get the tag_id (either from the insert or by querying the existing tag)
      let tagId;
      if (tagResult.rows.length > 0) {
        tagId = tagResult.rows[0].tag_id;
      } else {
        const existingTagQuery = `SELECT tag_id FROM tags WHERE tag_name = $1`;
        const existingTagResult = await pool.query(existingTagQuery, [tag]);
        tagId = existingTagResult.rows[0].tag_id;
      }

      // Associate the tag with the post in post_tags
      const postTagQuery = `
        INSERT INTO post_tags (post_id, tag_id)
        VALUES ($1, $2);
      `;
      await pool.query(postTagQuery, [postId, tagId]);
    }

    // Commit the transaction
    await pool.query("COMMIT");

    res.status(201).json({ post_id: postId, message: "Post created successfully!" });
  } catch (err) {
    // Rollback the transaction in case of an error
    await pool.query("ROLLBACK");
    console.error("Error creating feed post:", err);
    res.status(500).json({ error: "Database error" });
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
const { title, description, tags, image } = req.body;

const client = await pool.connect(); // Use a client for transaction

try {
    // Start a transaction
    await client.query('BEGIN');

    // Step 1: Process tags
    const tagIds = [];
    for (const tag of tags) {
        // Step 1.1: Check if the tag exists in the 'tags' table
        const tagResult = await client.query(
            'SELECT tag_id FROM tags WHERE tag_name = $1', [tag]
        );

        let tagId;
        if (tagResult.rowCount === 0) {
            // Step 1.2: If the tag does not exist, create it
            const insertTagResult = await client.query(
                'INSERT INTO tags (tag_name) VALUES ($1) RETURNING tag_id', [tag]
            );
            tagId = insertTagResult.rows[0].tag_id;
        } else {
            // If the tag exists, use its id
            tagId = tagResult.rows[0].tag_id;
        }

        // Collect all tag_ids to be inserted into the post_tags table
        tagIds.push(tagId);
    }

    // Step 2: Insert tags into the post_tags table if they don't already exist for the post
    for (const tagId of tagIds) {
        await client.query(
            'INSERT INTO post_tags (post_id, tag_id) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM post_tags WHERE post_id = $1 AND tag_id = $2)',
            [postId, tagId]
        );
    }

    // Step 3: Update the feed_posts table with the new information
    const query = `
        UPDATE feed_posts
        SET title = $1, content = $2, image_url = $3, date_created = NOW()
        WHERE post_id = $4
        RETURNING *;
    `;
    const result = await client.query(query, [title, description, image, postId]);

    if (result.rowCount === 0) {
        res.status(404).json({ error: 'Post not found' });
    } else {
        // Commit the transaction
        await client.query('COMMIT');
        res.status(200).json(result.rows[0]);
    }
} catch (err) {
    // Rollback the transaction if an error occurs
    await client.query('ROLLBACK');
    console.error('Error updating feed post:', err);
    res.status(500).json({ error: 'Database error' });
} finally {
    client.release(); // Release the client back to the pool
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

export const uploadImage = async (req, res) => {
  try {
    if (!req.file){
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
};

// Get all comments for a post
export const getPostComments = async (req, res) => {
  const { postId } = req.params;
  const userId = extractUserIdFromToken(req); // Get userId from the token

  try {
    const result = await pool.query(
      `SELECT c.comment_id, c.post_id, c.user_id, c.text, c.created_at, u.name,
              COUNT(pcl.comment_id) AS like_count,
              EXISTS (
                SELECT 1
                FROM post_comment_likes pcl
                WHERE pcl.comment_id = c.comment_id AND pcl.user_id = $2
              ) AS isLiked
       FROM post_comments c 
       JOIN users u ON c.user_id = u.user_id 
       LEFT JOIN post_comment_likes pcl ON c.comment_id = pcl.comment_id
       WHERE c.post_id = $1 
       GROUP BY c.comment_id, c.post_id, c.user_id, c.text, c.created_at, u.name
       ORDER BY c.created_at ASC`,
      [postId, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

// Add a comment to a post
export const addComment = async (req, res) => {
  const { postId, text } = req.body;
  const userId = extractUserIdFromToken(req); // Get userId from the token

  if (!text.trim()) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO post_comments (post_id, user_id, text) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [postId, userId, text]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = extractUserIdFromToken(req); // Get userId from the token

  try {
    const result = await pool.query(
      `DELETE FROM post_comments WHERE comment_id = $1 AND user_id = $2 RETURNING *`,
      [commentId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: "Unauthorized or comment not found" });
    }

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

// Like comment
export const likeComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = extractUserIdFromToken(req); // Get userId from the token
  try {
    await pool.query(
      `INSERT INTO post_comment_likes (comment_id, user_id) 
       VALUES ($1, $2) 
       ON CONFLICT DO NOTHING`,
      [commentId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error liking comment:", error);
    res.status(500).json({ error: "Failed to like comment" });
  }
};

// Unlike comment
export const unlikeComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = extractUserIdFromToken(req); // Get userId from the token
  try {
    const result = await pool.query(
      `DELETE FROM post_comment_likes WHERE comment_id = $1 AND user_id = $2 RETURNING *`,
      [commentId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Like not found" });
    }

    res.json({ success: true, message: "Comment unliked" });
  } catch (error) {
    console.error("Error unliking comment:", error);
    res.status(500).json({ error: "Failed to unlike comment" });
  }
};

// Get likes for a comment
export const getLikesForComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const result = await pool.query(
      `SELECT u.username FROM post_comment_likes l 
       JOIN users u ON l.user_id = u.user_id 
       WHERE l.comment_id = $1`,
      [commentId]
    );

    res.json({ likes: result.rows });
  } catch (error) {
    console.error("Error fetching comment likes:", error);
    res.status(500).json({ error: "Failed to fetch comment likes" });
  }
};