import express from 'express';
import { getAllFavorites, favoriteItem, unfavoriteItem } from '../controllers/favorites.js';  

const router = express.Router();

// Define routes
router.get('/favorites', getAllFavorites);  
router.post('/favorite/:listing_id', favoriteItem);  
router.delete('/favorite/:listing_id', unfavoriteItem);  

export default router;