import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true,
    },
    questions: [
        {
            questionText: {
                type: String,
                required: true,
            },
            options: [
                {
                    type: String,
                    required: true,
                },
            ],
            correctAnswer: {
                type: Number, // Index of the correct option (0-3)
                required: true,
            },
            explanation: {
                type: String, // Optional explanation for the answer
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
