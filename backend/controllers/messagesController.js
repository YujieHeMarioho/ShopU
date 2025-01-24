import pool from '../pool.js'; // Use the centralized pool instance

// Get all conversations for a user
export const getConversations = async (req, res) => {
  const { userId } = req.params;
  console.log('Fetching conversations for user:', userId); // Debug log

  try {
    const result = await pool.query(
      `SELECT * FROM conversations WHERE user1_id = $1 OR user2_id = $1`,
      [userId]
    );
    console.log('Conversations fetched:', result.rows); // Debug log
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all messages for a specific conversation
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  console.log('Fetching messages for conversation ID:', conversationId); // Debug log

  try {
    const result = await pool.query(
        `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`, // Use created_at instead of timestamp
        [conversationId]
    );
      
    console.log('Messages fetched:', result.rows); // Debug log
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new conversation
export const createConversation = async (req, res) => {
  const { user1_id, user2_id } = req.body;
  console.log('Creating a new conversation between:', user1_id, user2_id); // Debug log

  try {
    const result = await pool.query(
      `INSERT INTO conversations (user1_id, user2_id, created_at) VALUES ($1, $2, NOW()) RETURNING *`,
      [user1_id, user2_id]
    );
    console.log('Conversation created:', result.rows[0]); // Debug log
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send a message in a conversation
export const sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { senderId, content } = req.body;
  console.log('Incoming message details:', {
    conversationId,
    senderId,
    content,
  }); // Debug log

  if (!content || !content.trim()) {
    console.error('Message content is missing or empty'); // Debug log
    return res.status(400).json({ error: 'Message content is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [conversationId, senderId, content]
    );
    console.log('Message sent successfully:', result.rows[0]); // Debug log
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
