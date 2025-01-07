import express from 'express';
import { getAllCommunities, joinCommunity, leaveCommunity } from '../controllers/communities.js';  

const router = express.Router();

// Define routes
router.get('/communities', getAllCommunities)
router.post('/communities', joinCommunity)
router.delete('/communities/:community_id', leaveCommunity)

//router.get('/community/:community_id', );  

export default router;