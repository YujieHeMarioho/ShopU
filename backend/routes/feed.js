import express from 'express'; 
import { 
    getAllFeedPosts, 
    getFeedPostCount,
    getCommunityFeedPosts,
    getUserFeedPosts, 
    getUserFeedPostsCount,
    createFeedPost, 
    deleteFeedPost, 
    updateFeedPost, 
    shareFeedPost,
    likeFeedPost,
    uploadImage
} from '../controllers/feed.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// Get all feed posts
router.get('/feed', getAllFeedPosts);

// Get all feed posts count
router.get('/feed/count', getFeedPostCount);

// Get feed posts for a specific user
router.get('/feed/user', getUserFeedPosts);

router.get('/feed/communities/:community_id', getCommunityFeedPosts);

// Get all feed posts count
router.get('/feed/user/count', getUserFeedPostsCount);

// Create a new feed post
router.post('/feed/create', createFeedPost);

// Delete a feed post by ID
router.delete('/feed/:postId', deleteFeedPost);

// Update a feed post by ID
router.put('/feed/:postId', updateFeedPost);

// Share a feed post by ID
router.post('/feed/:postId/share', shareFeedPost);

// Like a post
router.post('/feed/:id/like', likeFeedPost);

// Upload image to S3
router.post('/feed/upload', upload.single('postImage'), uploadImage);

export default router;
