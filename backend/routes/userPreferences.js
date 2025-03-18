import express from 'express';
import { getUserSettings, updateUserSettings } from '../controllers/userPreferences.js';  

const router = express.Router();

router.get('/userPreferences/settings', getUserSettings); 
router.put('/userPreferences/settings', updateUserSettings);

export default router;