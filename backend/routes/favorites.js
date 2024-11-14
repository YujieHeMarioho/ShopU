import express from 'express';
import { getAllFavorites, favoriteItem, unfavoriteItem } from '../controllers/favoritesController.js';  

const router = express.Router();

// Define routes
router.get('/favorites', getAllFavorites);  
router.post('/favorite', favoriteItem);  
router.delete('/favorite/:listing_id', unfavoriteItem);  

export default router;