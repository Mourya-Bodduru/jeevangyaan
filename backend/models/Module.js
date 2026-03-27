import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a module title'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a module description'],
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
    },
    content: {
        type: String,
        required: [true, 'Please provide module content'], // Could be markdown or HTML
    },
    videoUrl: {
        type: String, // Optional video link
    },
    image: {
        type: String, // Path to module image
    },
    quiz: [
        {
            question: { type: String, required: true },
            options: [{ type: String, required: true }],
            correctAnswer: { type: String, required: true }, // Index or Value
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Module = mongoose.model('Module', moduleSchema);
export default Module;
