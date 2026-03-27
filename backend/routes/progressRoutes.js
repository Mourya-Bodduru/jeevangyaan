import express from 'express';
import { getCategoryProgress, markModuleComplete, checkModuleStatus, getUserProgress, getLeaderboard } from '../controllers/progressController.js';
import { submitQuiz } from '../controllers/quizController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.get('/categories', protect, getCategoryProgress);
router.post('/mark-complete', protect, markModuleComplete);
router.get('/status/:moduleId', protect, checkModuleStatus);
router.post('/submit-quiz', protect, submitQuiz);
router.get('/user-progress', protect, getUserProgress);
router.get('/leaderboard', protect, getLeaderboard);

export default router;
