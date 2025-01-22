import pool from '../pool.js';
import { jwtDecode } from "jwt-decode";

//get communities for user
export const getUserCommunities = async (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let user_id;
    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    const query = 'SELECT * FROM public.communities AS comms JOIN public.community_members AS mems ON comms.community_id = mems.community_id WHERE mems.user_id = $1';
    try {
        const result = await pool.query(query, [user_id]);
        const communities = result.rows.map(row => ({
            user_id: row.user_id,
            community_id: row.community_id,
            name: row.name,
            description: row.description,
            joined_at: row.joined_at,
          }));

        res.status(200).json(communities);
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

//get all communities
export const getAllCommunities = async (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let user_id;
    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    //const query = 'SELECT comms.community_id, comms.name, comms.description FROM public.communities AS comms LEFT JOIN public.community_members AS mems ON comms.community_id = mems.community_id WHERE mems.user_id != $1';
    const query = 'SELECT comms.community_id, comms.name, description FROM public.communities as comms LEFT JOIN public.community_members AS mems ON comms.community_id = mems.community_id WHERE mems.user_id != $1'
    try {
        const result = await pool.query(query, [user_id]); //user_id
        const communities = result.rows.map(row => ({
            community_id: row.community_id,
            name: row.name,
            description: row.description,
          }));

        res.status(200).json(communities);
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Endpoint to join a community
export const joinCommunity = async (req, res) => {
    const community_id = req.body.community_id;

    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let user_id;

    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if all required fields are provided
    if (!user_id || !community_id) {
        return res.status(400).json({ error: 'Missing required fields', fields: { user_id, community_id}});
    }

    // Generate the joined_at timestamp
    const joined_at = new Date().toISOString(); // Current timestamp in ISO format

    try {
        // Insert new association into the database
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

    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let user_id;

    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

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