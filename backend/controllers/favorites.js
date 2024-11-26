import pool from '../pool.js';

export const getAllFavorites = async (req, res) => {
    const query = 'SELECT * FROM public.favorites';
    try {
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Endpoint to add a new favorited item 
export const favoriteItem = async (req, res) => {
    const { listing_id } = req.params;
    // Grab user_id from auth0 once it's available
    const user_id = req.oidc.user.sub;

    // Check if all required fields are provided
    if (!user_id || !listing_id) {
        return res.status(400).json({ error: 'Missing required fields', fields: { user_id, listing_id}});
    }

    // Generate the favorited_at timestamp
    const favorited_at = new Date().toISOString(); // Current timestamp in ISO format

    try {
        // Insert new favorite into the database
        const result = await pool.query(
            'INSERT INTO favorites (user_id, listing_id, favorited_at) VALUES ($1, $2, $3)',
            [user_id, listing_id, favorited_at]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Endpoint to add a new favorited item 
export const unfavoriteItem = async (req, res) => {
    // Grab user_id from auth0 once it's available
    const user_id = req.oidc.user.sub;
    const { listing_id } = req.params;  

    // Check if all required fields are provided
    if (!user_id || !listing_id) {
        return res.status(400).json({ error: 'Missing required fields', fields: { user_id, listing_id} });
    }
    try {
        // Insert new favorite into the database
        const result = await pool.query(
            'DELETE FROM favorites WHERE user_id = $1 AND listing_ID = $2 RETURNING *',
            [user_id, listing_id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Favorite item not found' });
        }

        res.status(200).json({ message: 'Favorite removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default {getAllFavorites, favoriteItem, unfavoriteItem };