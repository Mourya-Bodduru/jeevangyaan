import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        enum: ['user', 'ai'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    messages: [messageSchema],
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;
