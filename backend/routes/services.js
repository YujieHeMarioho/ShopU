import express from 'express';
import { getAllServices, createService, rescheduleService, cancelService, getAppointmentsByServiceListingId, bookAppointment } from '../controllers/services.js';

const router = express.Router();

// Define the route for fetching all services (appointments)
router.get('/services/:userId', getAllServices);

// Returns appointments
router.get('/services/:serviceListingId/appointments', getAppointmentsByServiceListingId);

// create a new service
router.post('/services/create', createService);

router.post('/services/book/:service_id', bookAppointment);

// Reschedule an existing service
router.put('/services/appointment/:appointmentId/reschedule', rescheduleService)

// delete an existing service
router.delete('/services/appointment/:appointmentId/cancel', cancelService)

export default router;
