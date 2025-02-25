import express from 'express';
import { updateUser, getAllAuth0Users, createUser, getUserInfo, getUserCount, uploadProfileImage, getUserSearch, getProfilePicture } from '../controllers/users.js';  
import upload from '../middleware/multer.js';

const router = express.Router();

// Existing Routes
router.get('/auth0/users', getAllAuth0Users);
router.get('/users/count', getUserCount);
// If the user exists, do nothing; otherwise, create the user in the DB
router.post('/users', createUser);
// Update user info in the Auth0 DB
router.patch('/users', updateUser);
router.get('/user/:user_id', getUserInfo);
router.get('/users/search', getUserSearch);

// upload a new profile image
router.post('/users/upload',  upload.single('picture'), uploadProfileImage);

// Get user profile picutre
router.get('/:user_id/profile-picture', getProfilePicture);



export default router;
