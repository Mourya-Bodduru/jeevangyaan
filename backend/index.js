import dotenv from 'dotenv';
dotenv.config();
console.log('Loaded ENV Variables:', Object.keys(process.env).filter(key => !key.startsWith('npm_') && !key.startsWith('Program')));
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import errorhandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import uiTranslationRoutes from './routes/uiTranslationRoutes.js';
import userRequestRoutes from './routes/userRequestRoutes.js';
import scenarioRoutes from './routes/scenarioRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
// import communityRoutes from './routes/communityRoutes.js';

// ES6 module _dirname alternative
const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware to handle CORS
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    }));

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(_dirname, "uploads")));

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/translations/ui', uiTranslationRoutes);
app.use('/api/requests', userRequestRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/challenges', challengeRoutes);
// app.use('/api/community', communityRoutes);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        statusCode: 404
    });
});

app.use(errorhandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
process.on('unhandled Rejection', (err) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});