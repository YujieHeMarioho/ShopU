import express from 'express';
const router = express.Router();
import { getRecommendations, handleInsertView } from '../controllers/mlservice.js';

// ML-backed recommendation route
router.get("/recommendations", getRecommendations);

// Insert View for interaction
router.post("/view", handleInsertView);

export default router;