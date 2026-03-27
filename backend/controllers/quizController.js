import Module from '../models/Module.js';
import Progress from '../models/Progress.js';
import { translateModule } from '../utils/translateModule.js';

// @desc    Submit quiz answers and calculate score
// @route   POST /api/progress/submit-quiz
// @access  Private
// Expects: { moduleId: "...", answers: [...], language: "..." }

export const submitQuiz = async (req, res, next) => {
    try {
        const { moduleId, answers, language } = req.body;

        let module = await Module.findById(moduleId);
        if (!module) {
            return res.status(404).json({ success: false, error: 'Module not found' });
        }

        // Translate the module quiz if a language is provided, to match the user's answers
        if (language && language !== 'en') {
            module = await translateModule(module.toObject(), language);
        }

        const questions = module.quiz;
        if (!questions || questions.length === 0) {
            return res.status(400).json({ success: false, error: 'This module has no quiz.' });
        }

        let correctCount = 0;
        let details = [];

        questions.forEach((q, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === q.correctAnswer;
            if (isCorrect) correctCount++;
            details.push({
                questionIndex: index,
                isCorrect,
                correctAnswer: q.correctAnswer // Optional: don't send back if you want to hide it
            });
        });

        const scorePercentage = Math.round((correctCount / questions.length) * 100);

        // Update Progress
        let progress = await Progress.findOne({ user: req.user.id, module: moduleId });

        if (!progress) {
            progress = await Progress.create({
                user: req.user.id,
                module: moduleId,
                isCompleted: true, // Taking the quiz marks completion
                quizScore: scorePercentage,
                attempts: 1,
                lastAccessed: Date.now()
            });
        } else {
            // Update score if better
            if (scorePercentage > progress.quizScore) {
                progress.quizScore = scorePercentage;
            }
            progress.attempts += 1;
            progress.isCompleted = true; // Ensure marked complete
            progress.lastAccessed = Date.now();
            await progress.save();
        }

        res.status(200).json({
            success: true,
            data: {
                score: correctCount,
                total: questions.length,
                percentage: scorePercentage,
                details
            }
        });

    } catch (error) {
        next(error);
    }
};
