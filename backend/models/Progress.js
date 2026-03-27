import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    coinAwarded: {
        type: Boolean,
        default: false,
    },
    quizScore: {
        type: Number, // Score percentage
        default: 0,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    lastAccessed: {
        type: Date,
        default: Date.now,
    },
});

// Ensure a user has only one progress record per module
progressSchema.index({ user: 1, module: 1 }, { unique: true });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
