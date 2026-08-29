import Module from '../models/Module.js';
import axios from 'axios';

export const generateModuleStory = async (req, res) => {
    try {
        console.log("Generating story for module:", req.params.id);
        const module = await Module.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ success: false, error: 'Module not found' });
        }

        const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8002/generate-story';

        console.log("Sending module content to FastAPI ML Service...");

        const fullContext = `Title: ${module.title}\nDescription: ${module.description}\n\nContent details:\n${module.content}`;

        const response = await axios.post(fastApiUrl, {
            content: fullContext,
            language: req.query.lang || 'en'
        });

        const story = response.data.data;
        console.log("Story generated via FastAPI successfully");

        // Optionally save the story to the module if you want to cache it
        // module.aiStory = story;
        // await module.save();

        res.status(200).json({
            success: true,
            data: story
        });

    } catch (error) {
        console.error("AI Story Proxy Error:", error.message);

        res.status(500).json({
            success: false,
            error: "Failed to generate story. Please ensure the FastAPI ML service is running on port 8002.",
            details: error.message
        });
    }
};
import Progress from '../models/Progress.js';
import { translateModule } from '../utils/translateModule.js';

// @desc    Get all modules
// @route   GET /api/modules
// @access  Public
export const getModules = async (req, res, next) => {
    try {
        let modules = await Module.find();

        const lang = req.query.lang;
        if (lang && lang !== 'en') {
            modules = await Promise.all(modules.map(async (mod) => {
                return await translateModule(mod.toObject(), lang);
            }));
        }

        res.status(200).json({
            success: true,
            count: modules.length,
            data: modules
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single module
// @route   GET /api/modules/:id
// @access  Public
export const getModule = async (req, res, next) => {
    try {
        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({
                success: false,
                error: 'Module not found'
            });
        }

        let moduleObj = module.toObject();
        const lang = req.query.lang;

        if (lang && lang !== 'en') {
            moduleObj = await translateModule(moduleObj, lang);
        }

        res.status(200).json({
            success: true,
            data: moduleObj
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new module
// @route   POST /api/modules
// @access  Private (Admin only)
export const createModule = async (req, res, next) => {
    try {
        const moduleData = {
            ...req.body,
            image: req.file ? `/uploads/${req.file.filename}` : undefined
        };

        // Parse quiz if it's a string (from FormData)
        if (typeof moduleData.quiz === 'string') {
            moduleData.quiz = JSON.parse(moduleData.quiz);
        }

        const module = await Module.create(moduleData);

        res.status(201).json({
            success: true,
            data: module
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update module
// @route   PUT /api/modules/:id
// @access  Private (Admin only)
export const updateModule = async (req, res, next) => {
    try {
        let module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({
                success: false,
                error: 'Module not found'
            });
        }

        const moduleData = {
            ...req.body
        };

        // Parse quiz if it's a string (from FormData)
        if (typeof moduleData.quiz === 'string') {
            moduleData.quiz = JSON.parse(moduleData.quiz);
        }

        if (req.file) {
            moduleData.image = `/uploads/${req.file.filename}`;
        }

        module = await Module.findByIdAndUpdate(req.params.id, moduleData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: module
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete module
// @route   DELETE /api/modules/:id
// @access  Private (Admin only)
export const deleteModule = async (req, res, next) => {
    try {
        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({
                success: false,
                error: 'Module not found'
            });
        }

        await module.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
