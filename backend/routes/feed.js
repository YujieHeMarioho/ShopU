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
    uploadImage,
    getPostComments,
    addComment,
    deleteComment,
    likeComment,
    unlikeComment,
    getLikesForComment,
    getPostCommentCount,
    getFavorites,
    handleFavoriteAction,
    getPostLikes
} from '../controllers/feed.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// Get all feed posts
router.get('/feed', getAllFeedPosts);

// Get all feed posts count
router.get('/feed/count', getFeedPostCount);

// Get feed posts for a specific user
router.get('/feed/user/:user_id', getUserFeedPosts);

router.get('/feed/communities/:community_id', getCommunityFeedPosts);

// Get all feed posts count
router.get('/feed/user/count/:user_id', getUserFeedPostsCount);

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

// Get num likes for a post by ID
router.get('/feed/:postId/likes', getPostLikes);

// Upload image to S3
router.post('/feed/upload', upload.single('postImage'), uploadImage);

// Get all comments for a post
router.get('/feed/comments/:postId', getPostComments);

// Route to add a comment to a post
router.post('/feed/comments', addComment);

// Route to delete a comment
router.delete('/feed/comments/:commentId', deleteComment);

// Route to like a comment
router.post('/feed/comments/:commentId/like', likeComment);

// Route to unlike a comment
router.delete('/feed/comments/:commentId/like', unlikeComment);

// Route to get likes for a comment
router.get('/feed/comments/:commentId/likes', getLikesForComment);

router.get('/feed/comments/count/:postId', getPostCommentCount);

router.get('/feed/favorites', getFavorites);

router.post('/feed/favorites/:postId', handleFavoriteAction);

export default router;
