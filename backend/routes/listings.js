import express from 'express';
import { getAllListings } from '../controllers/listingsController.js';  

const router = express.Router();

// Define the route for fetching all listings
router.get('/listings', getAllListings);  // When a GET request is made to /api/listings, run getAllListings

export default router;
