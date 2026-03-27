import mongoose from 'mongoose';

const userRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    queryInfo: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    requiredThings: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Replied'],
        default: 'Pending'
    },
    adminReply: {
        type: String
    }
}, { timestamps: true });

const UserRequest = mongoose.model('UserRequest', userRequestSchema);

export default UserRequest;
