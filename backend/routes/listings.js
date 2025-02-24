import express from 'express';
import { getAllListings, createListing, getFavoritedListings, uploadImages, getAllCategories, editListing, deleteListing, getListingCount, getAllUserListings, getUserListingsCount, getSimilarListings } from '../controllers/listingsController.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// Define the route for fetching all listings
router.get('/listings', getAllListings);  // When a GET request is made to /api/listings, run getAllListings

router.get('/listings/count', getListingCount);

router.get('/listings/:id/category/:category', getSimilarListings);

//router.get('/listings/:userId', getAllUserListings);  // When a GET request is made to /api/listings, run getAllListings

router.get('/listings/user', getAllUserListings);  // When a GET request is made to /api/listings, run getAllListings

router.get('/listings/user/count', getUserListingsCount);


// get all favorited listings for a specific user
router.get('/listings/favorites', getFavoritedListings);  

// Route to get all categories to display
router.get('/marketplace/categories', getAllCategories);

//route to create a service listing
//router.post('/listings/create/service', createItemListing);

// //route to create an item  listing
// router.post('/listings/create/item', createServiceListing);

router.post('/listings/create', createListing);

// route to upload images to S3
router.post('/listings/uploadImages', upload.array('images', 5), uploadImages);

// route to edit a listing
router.put('/listings/:id/edit', editListing);

// route to delete a listing 
router.delete('/listings/:id/delete', deleteListing);

export default router;

