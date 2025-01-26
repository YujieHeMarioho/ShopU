import pool from '../pool.js'; // Ensure you have a database pool connection set up

export const createConversation = async (req, res) => {
  const { user1_id, user2_id } = req.body;

  console.log('Received request to create conversation:', { user1_id, user2_id });

  if (!user1_id || !user2_id) {
    return res.status(400).json({ error: 'Both user IDs are required.' });
  }

  try {
    const existingQuery = `
      SELECT * FROM conversations
      WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
    `;
    const existingResult = await pool.query(existingQuery, [user1_id, user2_id]);

    if (existingResult.rows.length > 0) {
      console.log('Conversation already exists:', existingResult.rows[0]);
      return res.json({ conversation_id: existingResult.rows[0].conversation_id });
    }

    const insertQuery = `
      INSERT INTO conversations (user1_id, user2_id, created_at)
      VALUES ($1, $2, NOW())
      RETURNING conversation_id
    `;
    const insertResult = await pool.query(insertQuery, [user1_id, user2_id]);

    console.log('New conversation created with ID:', insertResult.rows[0].conversation_id);
    res.json({ conversation_id: insertResult.rows[0].conversation_id });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
