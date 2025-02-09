import { pool } from '../pool.js'; 
import { jwtDecode } from "jwt-decode";

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

export const getFavoriteStatus = async (req, res) => {
    const { listing_id } = req.params;
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let userId;

    try {
        const decodedToken = jwtDecode(token); // Decode the token
        userId = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    const query = 'SELECT * FROM public.favorites WHERE user_id = $1 AND listing_id = $2';

    try {
    const result = await pool.query(query, [userId, listing_id]);
    if(result.rowCount > 0 ){
        res.status(200).json({isFavorited:  true});
    }
    else {
        res.status(200).json({isFavorited:  false});
    }
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ error: 'Database error' });
    }
};


// Endpoint to add a new favorited item 
export const favoriteItem = async (req, res) => {
    const { listing_id } = req.params;
    let userId;

    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    try {
        const decodedToken = jwtDecode(token); // Decode the token
        userId = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if all required fields are provided
    if (!userId || !listing_id) {
        return res.status(400).json({ error: 'Missing required fields', fields: { userId, listing_id}});
    }

    // Generate the favorited_at timestamp
    const favorited_at = new Date().toISOString(); // Current timestamp in ISO format

    try {
        // Insert new favorite into the database
        const result = await pool.query(
            'INSERT INTO favorites (user_id, listing_id, favorited_at) VALUES ($1, $2, $3)',
            [userId, listing_id, favorited_at]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Endpoint to add a new favorited item 
export const unfavoriteItem = async (req, res) => {
    const { listing_id } = req.params;  
    let userId;

    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    try {
        const decodedToken = jwtDecode(token); // Decode the token
        userId = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if all required fields are provided
    if (!userId || !listing_id) {
        return res.status(400).json({ error: 'Missing required fields', fields: { userId, listing_id} });
    }
    try {
        // Insert new favorite into the database
        const result = await pool.query(
            'DELETE FROM favorites WHERE user_id = $1 AND listing_ID = $2 RETURNING *',
            [userId, listing_id]
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

export default {getAllFavorites, favoriteItem, unfavoriteItem, getFavoriteStatus };