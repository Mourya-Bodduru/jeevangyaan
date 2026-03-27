import express from 'express';
import { getModules, getModule, createModule, updateModule, deleteModule, generateModuleStory } from '../controllers/moduleController.js';
import protect from '../middleware/auth.js';
import { admin } from '../middleware/adminMiddleware.js';

import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes for modules
router.get('/', getModules);
router.get('/:id', getModule);
router.post('/:id/story', protect, generateModuleStory);

// Protected routes (Admin only)
router.post('/', protect, admin, upload.single('image'), createModule);
router.put('/:id', protect, admin, upload.single('image'), updateModule);
router.delete('/:id', protect, admin, deleteModule);

export default router;
