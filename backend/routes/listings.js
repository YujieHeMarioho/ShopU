import express from 'express';
import { getAllListings, createListing,getFavoritedListings } from '../controllers/listingsController.js';

const router = express.Router();

// Define the route for fetching all listings
router.get('/listings', getAllListings);  // When a GET request is made to /api/listings, run getAllListings

router.get('/listings/favorites', getFavoritedListings);  // get all favorited listings for a specific user

//route to create a listing
router.post('/listings/create', createListing);


export default router;
