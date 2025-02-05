import express from 'express';
import { getUserCommunities, getAllCommunities, getCreatedCommunities, joinCommunity, leaveCommunity, addCommunity, uploadCommunityImage } from '../controllers/communities.js';  
import upload from '../middleware/multer.js';

const router = express.Router();

// Define routes
router.get('/communities', getUserCommunities)
router.get('/communities/all', getAllCommunities)
router.get('/communities/created', getCreatedCommunities)
router.post('/communities', joinCommunity)
router.post('/communities/add', addCommunity)
router.post('/communities/upload', upload.single('communityImage'), uploadCommunityImage)
router.delete('/communities/:community_id', leaveCommunity)

//router.get('/community/:community_id', );  

export default router;