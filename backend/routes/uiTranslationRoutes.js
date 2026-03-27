import express from 'express';
import { getUiTranslations } from '../controllers/uiTranslationController.js';

const router = express.Router();

router.get('/', getUiTranslations);

export default router;
