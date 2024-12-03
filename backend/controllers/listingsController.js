import pool from '../pool.js';

//Endpoint for fetching rows
export const getAllListings = async (req, res) => {
    const query = 'SELECT * FROM public.listings';  
    try {
        const result = await pool.query(query);  
        res.status(200).json(result.rows); 
    } catch (err) {
        console.error('Error running query:', err);  
        res.status(500).json({ error: 'Database error' });  
    }
};

//Endpoint for create a listing
export const createListing = async (req, res) => {
    try {
        const { title, description, category, type, rating, price } = req.body;

        // Retrieve uploaded image path from multer or use a default placeholder if none provided
        const imagePath = req.file ? req.file.path : 'https://via.placeholder.com/300x200';

        const query = `
            INSERT INTO public.listings (title, description, category, type, rating, price, image)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [title, description, category, type, rating || 0, price, imagePath];

        // Execute query
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating listing:', err);
        res.status(500).json({ error: 'Database error' });
    }
};