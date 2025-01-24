import express from 'express';
import {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
} from '../controllers/messagesController.js';

const router = express.Router();

// Route to get all conversations for a user
router.get('/conversations/:userId', getConversations);

// Route to create a new conversation
router.post('/conversations', createConversation);

// Route to get all messages in a specific conversation
router.get('/:conversationId/messages', getMessages);

// Route to send a message in a specific conversation
router.post('/:conversationId/messages', sendMessage);

export default router;
