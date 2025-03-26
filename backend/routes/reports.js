import express from 'express';
import { updateReport, getReports, createReport, getReportsFiltered} from '../controllers/reports.js';  

const router = express.Router();

router.get('/reports', getReports);
router.get('/reports/filtered', getReportsFiltered);

router.post('/reports/:id/action', updateReport);
router.post('/reports', createReport);

export default router;