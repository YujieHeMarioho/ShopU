import express from 'express';
import { createConversation, getConversations, getGroupchats, joinGroupchat, conversationBetweenUsers } from '../controllers/conversations.js';

const router = express.Router();

// POST route to create a new conversation
router.post('/', (req, res, next) => {
    console.log('Conversations POST route hit');
    next();
}, createConversation);

router.post('/groupchat', (req, res, next) => {
  console.log('Grupchat POST route hit');
  next();
}, joinGroupchat)


// GET route to fetch all conversations for a user
router.get('/:userId', (req, res, next) => {
    console.log('Conversations GET route hit for user:', req.params.userId);
    next();
  }, getConversations);

router.get('/groupchat/:userId', (req, res, next) => {
  console.log('Groupchat GET route hit for user:', req.params.userId);
  next();
}, getGroupchats);

// Route to find conversation between two ID's 
router.get('/:firstID/:secondID/find', conversationBetweenUsers);

export default router;
