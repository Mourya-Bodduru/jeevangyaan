import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        // Not required because Google OAuth users won't have a password
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values for normal users
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    coins: {
        type: Number,
        default: 0
    },
    communityJoined: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Hash password before saving
userSchema.pre('save', async function () {
    // Only validate password requirement for new users who are not Google users
    if (this.isNew && !this.googleId && !this.password) {
        throw new Error('Please provide a password');
    }

    // If password isn't modified (e.g. just updating coins), or if there's no password (Google user), skip hashing
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.model('User', userSchema);
export default User;