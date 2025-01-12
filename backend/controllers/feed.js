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
          u.username AS author
        FROM
          feed_posts f
        JOIN
          users u ON f.user_id = u.user_id
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
