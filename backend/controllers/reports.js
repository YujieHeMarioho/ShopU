import { pool } from '../pool.js'; 
import { jwtDecode } from "jwt-decode";

export const getReports = async (req, res) => {
    parseToken(req);

    const query = 'SELECT * FROM public.reports;';
    try {
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

export const getReportsFiltered = async (req, res) => {
    parseToken(req);

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filtering parameters
    const status = req.query.status;
    const type = req.query.type;

    // Sorting parameters
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    let query = 'SELECT * FROM public.reports';
    let countQuery = 'SELECT COUNT(*) FROM public.reports';
    let whereClause = [];
    let values = [];

    if (status) {
        whereClause.push(`status = $${values.length + 1}`);
        values.push(status);
    }

    if (type) {
        whereClause.push(`type = $${values.length + 1}`);
        values.push(type);
    }

    if (whereClause.length > 0) {
        query += ' WHERE ' + whereClause.join(' AND ');
        countQuery += ' WHERE ' + whereClause.join(' AND ');
    }

    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    try {
        const [reportResult, countResult] = await Promise.all([
            pool.query(query, values),
            pool.query(countQuery, values.slice(0, -2))
        ]);

        const totalReports = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalReports / limit);

        res.json({
            reports: reportResult.rows,
            currentPage: page,
            totalPages: totalPages,
            totalReports: totalReports
        });
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

export const updateReport = async (req, res) => {
    const { id } = req.params; 
    const { action } = req.body; 
  
    let userId;
    try {
      userId = parseToken(req);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or missing token' });
    }
  
    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }
  
    const statusMap = {
      'resolve': 'resolved',
      'escalate': 'escalated',
      'close': 'closed'
    };
  
    const newStatus = statusMap[action];
    if (!newStatus) {
      return res.status(400).json({ error: 'Invalid action' });
    }
  
    const query = `
      UPDATE reports
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
  
    const values = [newStatus, id];
  
    try {
      const result = await pool.query(query, values);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }
  
      // Log the action to the db 
      await pool.query(
        'INSERT INTO report_actions (report_id, user_id, action) VALUES ($1, $2, $3)',
        [id, userId, action]
      );
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating report:', err);
      res.status(500).json({ error: 'Database error' });
    }
  };

export const createReport = async (req, res) => {
    const { type, reportedItemId, reason, description } = req.body;

    let reporterId;
    try {
        reporterId = parseToken(req);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or missing token' });
    }
    if (!type || !reportedItemId || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const validTypes = ['listing', 'post','post-comment', 'user', 'message', 'comment', ];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid report type' });
    }

    const query = `
        INSERT INTO reports (type, reported_item_id, reporter_id, reason, description, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const values = [type, reportedItemId, reporterId, reason, description || null, 'pending'];

    try {
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating report:', err);
        res.status(500).json({ error: 'Database error' });
    }
};


const parseToken = (req) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let userId;

    try {
        const decodedToken = jwtDecode(token); // Decode the token
        userId = decodedToken.sub;
        if (!userId) {
            throw new Error('User ID not found in token');
        }
        return userId;
    } catch (err) {
        console.error('Error decoding token:', err);
        throw err; 
    }
}


export default {updateReport, getReports, createReport, getReportsFiltered };