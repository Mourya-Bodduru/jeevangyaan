import express from 'express';
import { simulateScenario, evaluateScenario } from '../controllers/scenarioController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.post('/simulate', protect, simulateScenario);
router.post('/evaluate', protect, evaluateScenario);

export default router;
