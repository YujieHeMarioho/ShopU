import { s3, pool, buckets } from '../pool.js';
import { jwtDecode } from 'jwt-decode';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const bucketName = buckets.feed;
const profileBucketName = buckets.profile;

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
    console.error('Error decoding token:', err);
    throw new Error('Invalid token');
  }

  return user_id;
};

// Fetch all feed posts
export const getAllFeedPosts = async (req, res) => {
  try {
    const userId = extractUserIdFromToken(req);

    const query = `
      SELECT
        f.post_id,
        f.title,
        f.content,
        u.profile_image as profile,
        fi.file_key as image,
        f.date_created,
        u.NAME AS author,
        u.user_id AS author_id,
        f.likes_count,
        f.shares_count AS shares, -- Updated to shares_count
        f.listing_id,
        COALESCE(ARRAY_AGG(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), ARRAY[]::TEXT[]) AS tags,
        EXISTS (
            SELECT 1
            FROM post_likes pl
            WHERE pl.post_id = f.post_id AND pl.user_id = $1
        ) AS isLiked
      FROM
          feed_posts f
      JOIN
          users u ON f.user_id = u.user_id
      JOIN
          post_images fi ON f.post_id = fi.post_id
      LEFT JOIN
          post_tags pt ON f.post_id = pt.post_id
      LEFT JOIN
          tags t ON pt.tag_id = t.tag_id
      GROUP BY
          f.post_id, u.user_id, fi.file_key
      ORDER BY
          f.date_created DESC;
    `;

    const result = await pool.query(query, [userId]);

    const feedWithUrls = await Promise.all(
      result.rows.map(async (feed) => {
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
        return feed;
      })
    );

    if (feedWithUrls.rowCount === 0) {
      console.log('No feed posts found.');
    }

    res.status(200).json(feedWithUrls);
  } catch (err) {
    console.error('Error fetching feed posts:', err.message);
    res.status(500).json({ error: err.message || 'Database error' });
  }
};

// Endpoint to get the total number of active posts in the feed
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
    const userId = extractUserIdFromToken(req);

    const likeCheckQuery = 'SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2';
    const likeCheckResult = await pool.query(likeCheckQuery, [userId, id]);

    if (likeCheckResult.rowCount > 0) {
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

// Get all feed posts for the community
export const getCommunityFeedPosts = async (req, res) => {
  try {
    const community_id = req.params.community_id;
    const userId = extractUserIdFromToken(req);

    const query = `
       SELECT
        f.post_id,
        f.title,
        f.content,
        f.image_url as profile,
        fi.file_key as image,
        f.date_created,
        u.user_id AS author,
        f.likes_count,
        f.shares_count AS shares, -- Updated to shares_count
        ARRAY_AGG(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL) AS tags
      FROM
          feed_posts f
      JOIN
          users u ON f.user_id = u.user_id
      JOIN
          post_images fi ON f.post_id = fi.post_id
      LEFT JOIN
          post_tags pt ON f.post_id = pt.post_id
      LEFT JOIN
          tags t ON pt.tag_id = t.tag_id
      INNER JOIN
          communities_posts cp ON cp.post_id = f.post_id
      WHERE
        cp.community_id = $1
      GROUP BY
          f.post_id, u.user_id, fi.file_key
      ORDER BY
          f.date_created DESC;
    `;

    const result = await pool.query(query, [community_id]);

    const feedWithUrls = await Promise.all(
      result.rows.map(async (feed) => {
        if (feed.image) {
          const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: feed.image,
          });
          feed.image = await getSignedUrl(s3, command, { expiresIn: 86400 });
        }
        return feed;
      })
    );

    if (feedWithUrls.length === 0) {
      console.log('No posts found for this community.');
    }

    res.status(200).json(feedWithUrls);
  } catch (err) {
    console.error('Error fetching community feed posts:', err.message);
    res.status(500).json({ error: err.message || 'Database error' });
  }
};

// Get all feed posts for a user
export const getUserFeedPosts = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `
       SELECT
        f.post_id,
        f.title,
        f.content,
        u.profile_image as profile,
        fi.file_key as image,
        f.date_created,
        u.NAME AS author,
        u.user_id AS author_id,
        f.likes_count,
        f.shares_count AS shares, -- Updated to shares_count
        f.listing_id,
        COALESCE(ARRAY_AGG(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), ARRAY[]::TEXT[]) AS tags,
        EXISTS (
            SELECT 1
            FROM post_likes pl
            WHERE pl.post_id = f.post_id AND pl.user_id = $1
        ) AS isLiked
      FROM
          feed_posts f
      JOIN
          users u ON f.user_id = u.user_id
      JOIN
          post_images fi ON f.post_id = fi.post_id
      LEFT JOIN
          post_tags pt ON f.post_id = pt.post_id
      LEFT JOIN
          tags t ON pt.tag_id = t.tag_id
      WHERE
        f.user_id = $1
      GROUP BY
          f.post_id, u.user_id, fi.file_key
      ORDER BY
          f.date_created DESC;
    `;

    const result = await pool.query(query, [user_id]);

    const feedWithUrls = await Promise.all(
      result.rows.map(async (feed) => {
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
        return feed;
      })
    );

    if (feedWithUrls.length === 0) {
      console.log('No posts found for this user.');
    }

    res.status(200).json(feedWithUrls);
  } catch (err) {
    console.error('Error fetching user feed posts:', err.message);
    res.status(500).json({ error: err.message || 'Database error' });
  }
};

// Get user feed posts count
export const getUserFeedPostsCount = async (req, res) => {
  try {
    const { user_id } = req.params;

    const query = `
      SELECT COUNT(*) AS post_count
      FROM feed_posts f
      WHERE f.user_id = $1;
    `;

    const result = await pool.query(query, [user_id]);
    res.status(200).json({ count: result.rows[0].post_count });
  } catch (err) {
    console.error('Error fetching user feed posts count:', err.message);
    res.status(500).json({ error: err.message || 'Database error' });
  }
};

// Create a new feed post
export const createFeedPost = async (req, res) => {
  const { title, content, tags, image } = req.body;

  try {
    const userId = extractUserIdFromToken(req);

    await pool.query("BEGIN");

    const postQuery = `
      INSERT INTO feed_posts (title, content, image_url, user_id, date_created, listing_id)
      VALUES ($1, $2, $3, $4, NOW(), $5)
      RETURNING post_id;
    `;

    let postListingId = req.body.listingId && req.body.listingId !== "" ? req.body.listingId : null;

    const postResult = await pool.query(postQuery, [title, content, 'https://via.placeholder.com/300x200', userId, postListingId]);
    const postId = postResult.rows[0].post_id;

    const imgQuery = `
    INSERT INTO post_images (post_id, file_key)
    VALUES ($1, $2)
    `;
    await pool.query(imgQuery, [postId, image]);

    const tagList = tags.split(",").map(tag => tag.trim());
    for (const tag of tagList) {
      const tagQuery = `
        INSERT INTO tags (tag_name)
        VALUES ($1)
        ON CONFLICT (tag_name) DO NOTHING
        RETURNING tag_id;
      `;
      const tagResult = await pool.query(tagQuery, [tag]);

      let tagId;
      if (tagResult.rows.length > 0) {
        tagId = tagResult.rows[0].tag_id;
      } else {
        const existingTagQuery = `SELECT tag_id FROM tags WHERE tag_name = $1`;
        const existingTagResult = await pool.query(existingTagQuery, [tag]);
        tagId = existingTagResult.rows[0].tag_id;
      }

      const postTagQuery = `
        INSERT INTO post_tags (post_id, tag_id)
        VALUES ($1, $2);
      `;
      await pool.query(postTagQuery, [postId, tagId]);
    }

    await pool.query("COMMIT");

    res.status(201).json({ post_id: postId, message: "Post created successfully!" });
  } catch (err) {
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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const tagIds = [];
    for (const tag of tags) {
      const tagResult = await client.query(
        'SELECT tag_id FROM tags WHERE tag_name = $1', [tag]
      );

      let tagId;
      if (tagResult.rowCount === 0) {
        const insertTagResult = await client.query(
          'INSERT INTO tags (tag_name) VALUES ($1) RETURNING tag_id', [tag]
        );
        tagId = insertTagResult.rows[0].tag_id;
      } else {
        tagId = tagResult.rows[0].tag_id;
      }
      tagIds.push(tagId);
    }

    for (const tagId of tagIds) {
      await client.query(
        'INSERT INTO post_tags (post_id, tag_id) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM post_tags WHERE post_id = $1 AND tag_id = $2)',
        [postId, tagId]
      );
    }

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
      await client.query('COMMIT');
      res.status(200).json(result.rows[0]);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating feed post:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
};

// Share a feed post
export const shareFeedPost = async (req, res) => {
  const { post_id } = req.params; // Match frontend :post_id
  const { userId } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE feed_posts
      SET shares_count = shares_count + 1
      WHERE post_id = $1
      RETURNING shares_count AS shares
      `,
      [post_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const updatedShares = result.rows[0].shares;
    res.status(200).json({ shares: updatedShares });
  } catch (error) {
    console.error('Error incrementing share count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload image (unchanged)
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const fileName = `${uuidv4()}-${req.file.originalname}`;
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

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

// Get all comments for a post (unchanged)
export const getPostComments = async (req, res) => {
  const { postId } = req.params;
  const userId = extractUserIdFromToken(req);

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

// Add a comment to a post (unchanged)
export const addComment = async (req, res) => {
  const { postId, text } = req.body;
  const userId = extractUserIdFromToken(req);

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

// Delete comment (unchanged)
export const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = extractUserIdFromToken(req);

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

// Like comment (unchanged)
export const likeComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = extractUserIdFromToken(req);
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

// Unlike comment (unchanged)
export const unlikeComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = extractUserIdFromToken(req);
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

// Get likes for a comment (unchanged)
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

// Get post comment count (unchanged)
export const getPostCommentCount = async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS comment_count FROM post_comments WHERE post_id = $1`,
      [postId]
    );

    res.json({ comment_count: result.rows[0].comment_count });
  } catch (error) {
    console.error("Error fetching comment count:", error);
    res.status(500).json({ error: "Failed to fetch comment count" });
  }
};