import express from 'express';
import {getFriends, addFriend, deleteFriend } from '../controllers/friends.js';  

const router = express.Router();

//friends APIs
// get all friends 
router.get('/friends/:user_id', getFriends)
//add new friend for the current user
router.post('/friends', addFriend)
//add new friend for the current user
router.delete('/friends/:user_id/:friend_id', deleteFriend)

export default router;