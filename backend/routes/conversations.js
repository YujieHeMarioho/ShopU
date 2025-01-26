import express from 'express';
import { createConversation } from '../controllers/conversations.js';

const router = express.Router();

// POST route to create a new conversation
router.post('/', (req, res, next) => {
    console.log('Conversations POST route hit');
    next();
}, createConversation);
  

export default router;
