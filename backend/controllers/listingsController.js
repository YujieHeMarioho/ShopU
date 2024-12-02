import pool from '../pool.js';

export const getAllListings = async (req, res) => {
    const query = 'SELECT * FROM public.listings';  
    try {
        const result = await pool.query(query);  
        res.status(200).json(result.rows);
        res.json(result.rows);  
    } catch (err) {
        console.error('Error running query:', err);  
        res.status(500).json({ error: 'Database error' });  
    }
};