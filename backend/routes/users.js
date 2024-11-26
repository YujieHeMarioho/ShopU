import express from 'express';
import { getAllUsers, updateUser, getAuth0User, getAllAuth0Users, createUser } from '../controllers/users.js';  

const router = express.Router();

// Define routes
router.get('/users', getAllUsers)
router.get('/auth0/users', getAllAuth0Users)
// if the user exists it does nothing and returns a response otherwise it creates the user in the db
router.post('/users', createUser)
// used to update user info in the auth0 db
router.patch('/users', updateUser)
router.get('/users/:user_id', getAuth0User)

export default router;