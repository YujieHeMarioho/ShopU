import pool from '../pool.js';

export const getAllCommunities = async (req, res) => {
    const query = 'SELECT * FROM public.communities';
    try {
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Endpoint to join a community
export const joinCommunity = async (req, res) => {
    const { community_id } = req.params;

    // Check if all required fields are provided
    if (!user_id || !community_id) {
        return res.status(400).json({ error: 'Missing required fields', fields: { user_id, listing_id}});
    }

    // Generate the joined_at timestamp
    const joined_at = new Date().toISOString(); // Current timestamp in ISO format

    try {
        // Insert new favorite into the database
        const result = await pool.query(
            'INSERT INTO community_members (community_id, user_id, joined_at) VALUES ($1, $2, $3)',
            [community_id, user_id, joined_at]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Endpoint to leave a community
export const leaveCommunity = async (req, res) => {
    const { community_id } = req.params;  

    // Check if all required fields are provided
    if (!user_id || !community_id) {
        return res.status(400).json({ error: 'Missing required fields', fields: { user_id, listing_id} });
    }
    try {
        // query leave community
        const result = await pool.query(
            'DELETE FROM community_members WHERE user_id = $1 AND community_id = $2 RETURNING *',
            [user_id, community_id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Community not found' });
        }

        res.status(200).json({ message: 'Community left successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default {getAllCommunities, joinCommunity, leaveCommunity };