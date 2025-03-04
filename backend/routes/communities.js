import express from 'express';
import upload from '../middleware/multer.js';
import { getCommunityDetails, 
    getUserCommunities, 
    getOtherCommunities, 
    getCreatedCommunities, 
    getCommunityMembers, 
    joinCommunity, 
    leaveCommunity, 
    deleteCommunity,
    addCommunity, 
    uploadCommunityImage,
    addSharedPost } from '../controllers/communities.js';  


const router = express.Router();

// Define routes
router.get('/community/:community_id', getCommunityDetails)
router.get('/communities', getUserCommunities)
router.get('/communities/other', getOtherCommunities)
router.get('/communities/created/:user_id', getCreatedCommunities)
router.get('/communities/members/:community_id', getCommunityMembers)
router.post('/communities', joinCommunity)
router.post('/communities/add', addCommunity)
router.post('/communities/upload', upload.single('communityImage'), uploadCommunityImage)
router.delete('/communities/:community_id', leaveCommunity)
router.post('/communities/share', addSharedPost)

//router.get('/community/:community_id', );  
router.delete('/communities/delete/:community_id', deleteCommunity)

export default router;