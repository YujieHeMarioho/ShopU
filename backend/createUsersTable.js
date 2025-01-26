// backend/createUsersTable.js

import pool from './pool.js';
import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

const createUsersTable = async () => {
    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'users.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute the SQL script
        await pool.query(sql);
        console.log('Users table created successfully.');
    } catch (error) {
        console.error('Error creating users table:', error);
    } finally {
        // End the pool connection
        await pool.end();
    }
};

createUsersTable();
