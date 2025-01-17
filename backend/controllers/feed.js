import pool from '../pool.js';

// Fetch all feed posts
export const getAllFeedPosts = async (req, res) => {
    const query = `
        SELECT
          f.post_id,
          f.title,
          f.content,
          f.image_url,
          f.date_created,
          u.user_id AS author,
          COALESCE(like_count, 0) AS like_count  -- Added like count
        FROM
          feed_posts f
        JOIN
          users u ON f.user_id = u.user_id
        LEFT JOIN (
          SELECT post_id, COUNT(*) AS like_count
          FROM post_likes
          GROUP BY post_id
        ) l ON f.post_id = l.post_id
        ORDER BY f.date_created DESC;
    `;

    try {
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching feed posts:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Like a feed post
export const likeFeedPost = async (req, res) => {
  const { id } = req.params;
  const { userId, isLiked } = req.body;

  console.log('Received like request for post ID:', id);
  console.log('User ID:', userId);
  console.log('Is Liked:', isLiked);

  try {
    // Find the post by ID
    const post = await Post.findById(id);
    if (!post) {
      console.log('Post not found');
      return res.status(404).json({ error: 'Post not found' });
    }

    // Log the post before update
    console.log('Post before update:', post);

    if (isLiked) {
      // Add the like
      if (!post.likes.includes(userId)) {
        post.likes.push(userId);
        console.log('Added like to post:', post);
      } else {
        console.log('User already liked this post');
      }
    } else {
      // Remove the like
      post.likes = post.likes.filter(like => like !== userId);
      console.log('Removed like from post:', post);
    }

    await post.save();

    // Log after save
    console.log('Post after like update:', post);

    res.status(200).json({ success: true, likes: post.likes.length });
  } catch (error) {
    console.error('Error updating like:', error);
    res.status(500).json({ error: 'Failed to update like' });
  }
};

// Fetch feed posts for a specific user
export const getUserFeedPosts = async (req, res) => {
    const { userId } = req.params;
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
    const { title, content, imageUrl, userId } = req.body;

    const query = `
        INSERT INTO feed_posts (title, content, image_url, user_id, date_created)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *;
    `;

    try {
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

// Share a feed post by ID
export const shareFeedPost = async (req, res) => {
    const { postId } = req.params;
    const { userId } = req.body;

    const query = `
        INSERT INTO feed_posts (title, content, image_url, user_id, date_created)
        SELECT title, content, image_url, $1, NOW()
        FROM feed_posts
        WHERE post_id = $2
        RETURNING *;
    `;

    try {
        const result = await pool.query(query, [userId, postId]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Post not found' });
        } else {
            res.status(201).json(result.rows[0]);
        }
    } catch (err) {
        console.error('Error sharing feed post:', err);
        res.status(500).json({ error: 'Database error' });
    }
};
