import express from 'express';
import { body } from 'express-validator';
import {
    register,
    login,
    googleAuth,
    getProfile,
    updateProfile,
    changePassword
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';
const router = express.Router();
// Validation middleware
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Username must be atleast 3 characters'),
    body('email')
        .isEmail()
        .withMessage('Invalid email address'),
    body('password')
        .trim()
        .isLength({ min: 6 })
        .withMessage('Password must be atleast 6 characters'),
];
const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];
// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/google', googleAuth);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
export default router;
