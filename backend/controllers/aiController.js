import axios from 'axios';
import Module from '../models/Module.js';
import ChatHistory from '../models/ChatHistory.js';

export const chatWithAI = async (req, res, next) => {
    try {
        const { message, history, lang } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: "Message is required" });
        }

        // Fetch modules to send to FastAPI for Semantic Search matching
        const modules = await Module.find().select('title description category');

        // Call our local FastAPI ML Service
        const fastApiUrl = process.env.FASTAPI_URL ? `${process.env.FASTAPI_URL}/chat-assist` : 'http://localhost:8002/chat-assist';

        console.log(`Sending chat to FastAPI for Semantic Search (Lang: ${lang || 'en'})`);
        const response = await axios.post(fastApiUrl, {
            message: message,
            history: history || [],
            modules: modules,
            language: lang || 'en'
        });

        const reply = response.data.reply;

        // Persist the user message and AI reply to the database
        const userId = req.user._id;
        await ChatHistory.findOneAndUpdate(
            { userId },
            {
                $push: {
                    messages: {
                        $each: [
                            { sender: 'user', text: message, timestamp: new Date() },
                            { sender: 'ai',   text: reply,   timestamp: new Date() }
                        ]
                    }
                },
                $set: { updatedAt: new Date() }
            },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            reply
        });

    } catch (error) {
        console.error("AI Chat Proxy Error:", error.message);
        res.status(500).json({
            success: false,
            error: "Failed to get response from JeevanGuru. Please ensure the FastAPI ML service is running on port 8002."
        });
    }
};

// @desc  Get current user's chat history
// @route GET /api/ai/chat-history
// @access Private
export const getChatHistory = async (req, res, next) => {
    try {
        const history = await ChatHistory.findOne({ userId: req.user._id });
        res.status(200).json({
            success: true,
            messages: history ? history.messages : []
        });
    } catch (error) {
        console.error("Get Chat History Error:", error.message);
        res.status(500).json({ success: false, error: "Failed to retrieve chat history." });
    }
};

// @desc  Clear current user's chat history (called on logout)
// @route DELETE /api/ai/chat-history
// @access Private
export const clearChatHistory = async (req, res, next) => {
    try {
        await ChatHistory.findOneAndDelete({ userId: req.user._id });
        res.status(200).json({ success: true, message: "Chat history cleared." });
    } catch (error) {
        console.error("Clear Chat History Error:", error.message);
        res.status(500).json({ success: false, error: "Failed to clear chat history." });
    }
};

export const debateWithAI = async (req, res, next) => {
    try {
        const { topic, argument, language } = req.body;

        if (!topic || !argument) {
            return res.status(400).json({ success: false, error: "Topic and argument are required" });
        }

      const fastApiUrl = process.env.FASTAPI_URL ? `${process.env.FASTAPI_URL}/debate-assist` : 'http://localhost:8002/debate-assist';


        console.log(`Sending debate to FastAPI (Lang: ${language || 'en'})`);
        const response = await axios.post(fastApiUrl, {
            topic: topic,
            argument: argument,
            language: language || 'en'
        });

        res.status(200).json({
            success: true,
            reply: response.data.reply
        });

    } catch (error) {
        console.error("AI Debate Proxy Error:", error.message);
        res.status(500).json({
            success: false,
            error: "Failed to get response from JeevanGuru. Please ensure the FastAPI ML service is running on port 8002."
        });
    }
};
