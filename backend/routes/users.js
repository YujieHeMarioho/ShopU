import express from 'express';
import { updateUser, getAllAuth0Users, createUser, getUserInfo } from '../controllers/users.js';  

const router = express.Router();

// Existing Routes
router.get('/auth0/users', getAllAuth0Users);
// If the user exists, do nothing; otherwise, create the user in the DB
router.post('/users', createUser);
// Update user info in the Auth0 DB
router.patch('/users', updateUser);
router.get('/user/:user_id', getUserInfo);

export default router;
