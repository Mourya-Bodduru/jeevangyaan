import express from 'express';
import { submitChallenge, getUserChallenges } from '../controllers/challengeController.js';
import protect from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.get('/:moduleId', protect, getUserChallenges);
router.post('/:moduleId', protect, submitChallenge);

export default router;
