import express from 'express';
import {getPolicies, addDefualtPolicies, updatePolicies } from '../controllers/privacyPolicies.js';  

const router = express.Router();

//Privacy APIs
router.get('/policies', getPolicies)
router.post('/policies', addDefualtPolicies)
router.put('/policies', updatePolicies)

export default router;