import express from 'express';
import { getAllFeedPosts, getUserFeedPosts, createFeedPost } from '../controllers/feedController.js';

const router = express.Router();

// Get all feed posts
router.get('/feed', getAllFeedPosts);

// Get feed posts for a specific user
router.get('/feed/user/:userId', getUserFeedPosts);

// Create a new feed post
router.post('/feed/create', createFeedPost);

export default router;
