// index.js
import express from 'express';
import pool from './pool.js'; // Ensure the path is correct
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 8080;

// Middleware (if any)
// e.g., app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Hello World! API is running....');
});

// Test endpoint to check database connection
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()'); // Simple query to test connection
        res.json({ success: true, timestamp: result.rows[0] });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ success: false, message: 'Failed to connect to the database' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
