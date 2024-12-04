import pool from '../pool.js';

//Endpoint for fetching rows
export const getAllListings = async (req, res) => {
    const query = `
        SELECT
          l.listing_id,
          l.title,
          l.description,
          c.name AS category,  -- Get the category name
          l.item_type,
          l.star_rating,
          l.price,
          l.image_url
        FROM
          listings l
        JOIN
          categories c ON l.category_id = c.category_id;
      `;
 
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
        const { title, description, category, type, rating, price, condition} = req.body;
        // Retrieve uploaded image path from multer or use a default placeholder if none provided
        const imagePath = req.file ? req.file.path : 'https://via.placeholder.com/300x200';

        //database call to get category id

        const query = `
            INSERT INTO public.listings (title, description, category_id, item_type, star_rating, price, image_url, condition, date_posted, user_id)
            VALUES ($1, $2, 10, $3, $4, $5, $6, $7, $8, 1)
            RETURNING *;
        `;
        const values = [title, description, type, rating || 0, price, imagePath, condition, new Date().toISOString()];
        
        // Execute query
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating listing:', err);
        res.status(500).json({ error: 'Database error' });
    }
};