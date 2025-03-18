import { pool } from '../pool.js'; // Assuming you're using a pool for database queries

// Endpoint to get all services (appointments)
export const getAllServices = async (req, res) => {
  const query = `
    SELECT
      s.service_id,
      s.date,
      s.time,
      s.service_name,
      s.customer_name,
      s.estimated_time,
      s.service_type,
      s.price
    FROM
      services s
  `;

  try {
    const result = await pool.query(query);
    
    // Map over the results and return the data in the desired format
    const services = result.rows;

    res.status(200).json(services);
  } catch (err) {
    console.error('Error running query:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const createService = async (req, res) => {
    const { date, time, service_name, customer_name, estimated_time, service_type, price } = req.body;
  
    try {
      // Assuming `price` is now part of the request body
      const query = `
        INSERT INTO services (date, time, service_name, customer_name, estimated_time, service_type, price)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
  
      const values = [date, time, service_name, customer_name, estimated_time, service_type, price];
  
      const result = await pool.query(query, values);
  
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating service:', err);
      res.status(500).json({ error: 'Database error' });
    }
  };
  
