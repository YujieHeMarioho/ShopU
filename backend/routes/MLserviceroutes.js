import express from 'express';
const router = express.Router();
import { getRecommendations, trackInteraction, updateLogin, fetchUserPreferences, fetchUserEngagement, fetchSocialGraph, fetchActivityHistory } from '../controllers/mlservice.js';

// ML-backed recommendation route
router.get("/recommendations", getRecommendations);

// Track user interactions (likes, clicks, etc.)
router.post("/track-interaction", trackInteraction);

// Update last login timestamp
router.post("/update-login", updateLogin);

// Fetch user preferences (categories, search history, etc.)
router.get("/user-preferences", fetchUserPreferences);

// Fetch user engagement data (likes, saves, shares)
router.get("/user-engagement", fetchUserEngagement);

// Fetch user's social graph (friends, following)
router.get("/user-social-graph", fetchSocialGraph);

// Fetch user activity history (last login, last interaction)
router.get("/user-activity", fetchActivityHistory);

export default router;