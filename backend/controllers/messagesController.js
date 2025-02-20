import { pool } from '../pool.js'; 

// Get all conversations for a user
export const getConversations = async (req, res) => {
  const { userId } = req.params;
  console.log('Fetching conversations for user:', userId); // Debug log

  try {
    const result = await pool.query(
      `SELECT 
        c.conversation_id AS conversation_id,
        c.user1_id,
        c.user2_id,
        c.created_at,
        u1.name AS user1_name,
        u2.name AS user2_name,
        u1.profile_image AS user1_profile_image,
        u2.profile_image AS user2_profile_image
      FROM 
        conversations c
      JOIN 
        users u1 ON c.user1_id = u1.user_id
      JOIN 
        users u2 ON c.user2_id = u2.user_id
      WHERE 
        c.user1_id = $1 OR c.user2_id = $1
      ORDER BY 
        c.created_at DESC`, [userId]);
    
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
