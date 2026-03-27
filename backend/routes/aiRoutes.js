import express from 'express';
import { chatWithAI, debateWithAI, getChatHistory, clearChatHistory } from '../controllers/aiController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.post('/chat', protect, chatWithAI);
router.post('/debate-assist', protect, debateWithAI);
router.get('/chat-history', protect, getChatHistory);
router.delete('/chat-history', protect, clearChatHistory);

export default router;
