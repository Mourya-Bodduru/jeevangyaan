import ChallengeSubmission from '../models/ChallengeSubmission.js';
import axios from 'axios';

// Get user's past challenges for a specific module
export const getUserChallenges = async (req, res, next) => {
    try {
        const { moduleId } = req.params;
        const challenges = await ChallengeSubmission.find({
            userId: req.user._id,
            moduleId: moduleId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: challenges
        });
    } catch (error) {
        console.error("Fetch Challenges Error:", error);
        res.status(500).json({ success: false, error: 'Failed to fetch challenge submissions' });
    }
};

// Submit a new challenge and get AI review
export const submitChallenge = async (req, res, next) => {
    try {
        const { moduleId } = req.params;
        const { challengeText, lang } = req.body;

        if (!challengeText) {
            return res.status(400).json({ success: false, error: 'Challenge text is required' });
        }

        // 1. Send to AI for evaluation
        const fastApiUrl = 'http://localhost:8002/chat-assist';
        const evaluationPrompt = `The user is submitting proof of a real-world action they took for a life skills module. Review their submission and give them encouraging, constructive feedback in 2-3 sentences. If it sounds completely irrelevant, gently let them know. User Submission: "${challengeText}"`;

        let aiFeedback = "Great job! Keep practicing your skills in the real world.";
        try {
            const response = await axios.post(fastApiUrl, {
                message: evaluationPrompt,
                history: [], // No history needed for a one-off evaluation
                modules: [],
                language: lang || 'en'
            });
            aiFeedback = response.data.reply;
        } catch (aiError) {
            console.error("AI Evaluation Proxy Error:", aiError.message);
            // Fallback to default feedback if AI service is down
        }

        // 2. Save submission to DB
        const submission = await ChallengeSubmission.create({
            userId: req.user._id,
            moduleId: moduleId,
            challengeText: challengeText,
            aiFeedback: aiFeedback,
            status: 'reviewed'
        });

        res.status(201).json({
            success: true,
            data: submission
        });

    } catch (error) {
        console.error("Submit Challenge Error:", error);
        res.status(500).json({ success: false, error: 'Failed to submit challenge' });
    }
};
