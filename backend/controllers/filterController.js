import pool from '../pool.js';

//Endpoint for fetching rows
export const getAllfilters = async (req, res) => {

    const queryCategories = 'SELECT name FROM public.categories WHERE parent_category_id IS NULL';  
    //const queryTypes = 'SELECT name FROM public.types';  

    try {
        const result = await pool.query(queryCategories);  

           // Transform the result an array of category names
           const categories = result.rows.map(row => row.name);

        res.status(200).json({categories: categories}); 
    } catch (err) {
        console.error('Error running query:', err);  
        res.status(500).json({ error: 'Database error' });  
    }
};