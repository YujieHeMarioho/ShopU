import { pool } from '../pool.js'; // Ensure you have a database pool connection set up

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

export const joinGroupchat = async (req, res) => {
  const { user_id, community_id } = req.body;

  console.log('Received request to join conversation:', { user_id, community_id });

  if (!user_id || !community_id) {
    return res.status(400).json({ error: 'Both user ID and community ID required.' });
  }
  try {
    const existingQuery = `
      SELECT * FROM groupchat_members
      WHERE (user_id = $1 AND community_id = $2)
    `;
    const existingResult = await pool.query(existingQuery, [user_id, community_id]);

    if (existingResult.rows.length > 0) {
      console.log('Already joined:', existingResult.rows[0]);
      return res.json({ community_id: existingResult.rows[0].community_id });
    }

    const insertQuery = `
      INSERT INTO groupchat_members (user_id, community_id, joined_at)
      VALUES ($1, $2, NOW())
    `;
    const insertResult = await pool.query(insertQuery, [user_id, community_id]);

    console.log('Joined groupchat with ID:', community_id);
    res.json({ community_id: community_id });
  } catch (error) {
    console.error('Error joining groupchat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// Fetch all conversations for a user
export const getConversations = async (req, res) => {
  const { userId } = req.params;

  console.log('Fetching conversations for user:', userId);

  try {
    const result = await pool.query(
      `
      SELECT conversation_id, user1_id, user2_id, created_at
      FROM conversations
      WHERE user1_id = $1 OR user2_id = $1
      `,
      [userId]
    );

    console.log('Conversations fetched:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch all groupchats for a user
export const getGroupchats = async (req, res) => {
  const { userId } = req.params;

  console.log('Fetching conversations for user:', userId);

  try {
    const result = await pool.query(
      `
      SELECT community_id, user_id, joined_at
      FROM groupchat_members
      WHERE user_id = $1
      `,
      [userId]
    );

    console.log('groupchats fetched:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching groupchats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const conversationBetweenUsers = async (req, res) => {
  const { firstID, secondID } = req.params;

  console.log("Checking for conversation between users:", firstID, secondID);

  try {
    // Check if a conversation already exists between the two users
    const result = await pool.query(
      `
      SELECT * FROM conversations
      WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
      `,
      [firstID, secondID]
    );

    if (result.rows.length > 0) {
      return res.json({ conversation_id: result.rows[0].conversation_id });
    }

    // If no conversation exists, create a new one
    const newConversationResult = await pool.query(
      `
      INSERT INTO conversations (user1_id, user2_id, created_at)
      VALUES ($1, $2, NOW()) RETURNING *`,
      [firstID, secondID]
    );

    // Return the ID of the new conversation
    return res.status(201).json({ conversation_id: newConversationResult.rows[0].conversation_id });
  } catch (error) {
    console.error('Error checking or creating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
