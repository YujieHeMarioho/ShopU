import express from 'express';
import {getFriends, addFriend, deleteFriend, getFriendsCount } from '../controllers/friends.js';  

const router = express.Router();

//friends APIs
// get all friends 
router.get('/friends', getFriends)
router.get('/friends/count/:user_id', getFriendsCount)
//add new friend for the current user
router.post('/friends', addFriend)
//add new friend for the current user
router.delete('/friends/:friend_id', deleteFriend)

export default router;