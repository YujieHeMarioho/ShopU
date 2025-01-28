import express from 'express';
import { getUserCommunities, getAllCommunities, joinCommunity, leaveCommunity, addCommunity } from '../controllers/communities.js';  

const router = express.Router();

// Define routes
router.get('/communities', getUserCommunities)
router.get('/communities/all', getAllCommunities)
router.post('/communities', joinCommunity)
router.post('/communities/add', addCommunity)
router.delete('/communities/:community_id', leaveCommunity)

//router.get('/community/:community_id', );  

export default router;