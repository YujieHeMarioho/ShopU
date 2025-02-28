import express from 'express';
import { createConversation, getConversations } from '../controllers/conversations.js';

const router = express.Router();

// POST route to create a new conversation
router.post('/', (req, res, next) => {
    console.log('Conversations POST route hit');
    next();
}, createConversation);


// GET route to fetch all conversations for a user
router.get('/:userId', (req, res, next) => {
    console.log('Conversations GET route hit for user:', req.params.userId);
    next();
  }, getConversations);

export default router;
