import express from 'express';
import {getFriends, addFriend, deleteFriend, getFriendsCount, getFriendRequestStatus } from '../controllers/friends.js';  

const router = express.Router();

//friends APIs
// get all friends 
router.get('/friends', getFriends)
router.get('/friends/count/:user_id', getFriendsCount)
//add new friend for the current user
router.post('/friends', addFriend)
//add new friend for the current user
router.delete('/friends/:friend_id', deleteFriend)

router.post('/follow', addFriend)
router.delete('/unfollow/:friend_id', deleteFriend)
router.get('/follow/status/:authorId', getFriendRequestStatus)

export default router;