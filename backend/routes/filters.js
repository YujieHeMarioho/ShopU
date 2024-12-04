import express from 'express';
import { getAllfilters} from '../controllers/filterController.js';

const router = express.Router();

// Define the route for fetching all filters
router.get('/filters', getAllfilters);  

export default router;
