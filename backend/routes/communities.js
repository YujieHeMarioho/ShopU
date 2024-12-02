import express from 'express';
import { getAllFavorites, favoriteItem, unfavoriteItem } from '../controllers/favorites.js';  

const router = express.Router();

// Define routes
router.get('/communities', getAllCommunities);  
router.post('/communities/:community_id', joinCommunity);  
router.delete('/communities/:community_id', leaveCommunity);  

export default router;