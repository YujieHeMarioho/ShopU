import { pool } from '../pool.js'; // Assuming you're using a pool for database queries

// Endpoint to get all services (appointments)
export const getAllServices = async (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT
      s.service_id,
      s.date,
      s.time,
      s.service_name,
      s.customer_name,
      s.estimated_time,
      s.service_type,
      s.price,
      s.service_owner,
      s.customer_id
    FROM
      services s
    WHERE
      s.service_owner = $1
  `;

  try {
    const result = await pool.query(query, [userId]);

    // Map over the results and return the data in the desired format
    const services = result.rows;

    res.status(200).json(services);
  } catch (err) {
    console.error('Error running query:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const createService = async (req, res) => {
  const { date, time, service_name, customer_name, estimated_time, service_type, price, service_owner, service_listing_id } = req.body;

  try {
    // Assuming `price` is now part of the request body
    const query = `
        INSERT INTO services (date, time, service_name, customer_name, estimated_time, service_type, price, service_owner, service_listing_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;

    const values = [date, time, service_name, customer_name, estimated_time, service_type, price, service_owner, service_listing_id];

    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const rescheduleService = async (req, res) => {
  const { appointmentId } = req.params;
  const { newDate, newTime } = req.body;

  console.log(appointmentId)
  
  try {
    // Step 2: Construct SQL query to update the appointment
    const query = `
      UPDATE services 
      SET 
        date = $1,
        time = $2
      WHERE service_id = $3
      RETURNING *;
    `;

    // Step 3: Execute the query
    const values = [newDate, newTime, appointmentId]; 
    const { rows } = await pool.query(query, values); 

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Step 4: Return the updated appointment
    return res.status(200).json({
      message: 'Appointment rescheduled successfully.',
      appointment: rows[0], // Return the updated appointment
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occurred while rescheduling the appointment.' });
  }
}

export const cancelService = async (req, res) => {
  const { appointmentId } = req.params;

  try {

    await pool.query("DELETE FROM services WHERE service_id = $1", [appointmentId]);


    res.json({ message: "Appointment deleted" });
  } catch (error) {
    console.error("Error canceling appointment:", error);
    res.status(500).json({ error: "Failed to cancel appointment" });
  }
};

export const getAppointmentsByServiceListingId = async (req, res) => {
  const { serviceListingId } = req.params;

  const query = `
  SELECT date, time, service_id
  FROM services
  WHERE service_listing_id = $1
  AND customer_id IS NULL
`;

  try {
    const result = await pool.query(query, [serviceListingId]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching appointments by listing ID:", err);
    res.status(500).json({ error: "Database error" });
  }
};

export const bookAppointment = async (req, res) => {
  const { service_id } = req.params;  // Get service_id from URL parameter
  const { customer_id } = req.body;  // Get customer_id from request body

  // Query to check if the service exists and is available (customer_id is NULL)
  const checkServiceQuery = `
    SELECT service_id, customer_id
    FROM services
    WHERE service_id = $1 AND customer_id IS NULL;
  `;

  // Query to get the customer's name from the users table
  const customerNameQuery = `
    SELECT name 
    FROM users
    WHERE user_id = $1;
  `;
  
  try {
    // Check if the service is available
    const result = await pool.query(checkServiceQuery, [service_id]);

    // If the service doesn't exist or is already booked (customer_id is not NULL)
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Service not available for booking." });
    }

    // Fetch the customer's name based on the customer_id
    const customerResult = await pool.query(customerNameQuery, [customer_id]);

    // If the customer doesn't exist
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const customer_name = customerResult.rows[0].name;

    // Now update the service's customer_id and customer_name with the logged-in user's info
    const updateServiceQuery = `
      UPDATE services
      SET customer_id = $1, customer_name = $2
      WHERE service_id = $3
      RETURNING *;
    `;

    const updateValues = [customer_id, customer_name, service_id];
    const updateResult = await pool.query(updateServiceQuery, updateValues);

    // If successful, return the updated service details
    return res.status(200).json({
      message: "Appointment booked successfully.",
      service: updateResult.rows[0]
    });
  } catch (err) {
    console.error("Error booking appointment:", err);
    res.status(500).json({ error: "Database error while booking appointment." });
  }
};
