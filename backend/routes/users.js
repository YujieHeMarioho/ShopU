import express from 'express';
import { updateUser, getAllAuth0Users, createUser, getUserInfo, getUserCount, uploadProfileImage, getUserSearch, getProfilePicture, getCurrentUserInfo, getUserRoles, addUserRole, deleteUserRole } from '../controllers/users.js';  
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
router.get('/user/:user_id/roles', getUserRoles);
router.post('/user/:user_id/roles', addUserRole);
router.delete('/user/:user_id/roles/:role_name', deleteUserRole);

// upload a new profile image
router.post('/users/upload',  upload.single('picture'), uploadProfileImage);

// Get user profile picutre
router.get('/:user_id/profile-picture', getProfilePicture);

router.get('/users/current', getCurrentUserInfo);

export default router;