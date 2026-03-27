import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true
    },
    challengeText: {
        type: String,
        required: [true, 'Please provide text for your submission']
    },
    aiFeedback: {
        type: String,
        default: 'Pending review...'
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('ChallengeSubmission', challengeSchema);
