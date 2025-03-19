import express from 'express';
import { getAllServices, createService } from '../controllers/services.js';

const router = express.Router();

// Define the route for fetching all services (appointments)
router.get('/services', getAllServices);

router.post('/services', createService);

export default router;
