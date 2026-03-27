import express from 'express';
import { createRequest, getAllRequests, replyToRequest } from '../controllers/userRequestController.js';
import protect from '../middleware/auth.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createRequest)
    .get(protect, admin, getAllRequests);

router.route('/:id/reply')
    .post(protect, admin, replyToRequest);

export default router;
