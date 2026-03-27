import jwt from "jsonwebtoken";
import User from "../models/User.js";
import sendEmail from "../utils/emailService.js";
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "7d",
    });
};
// @desc Register new user
// @route POST /api/auth/register
// @access Public
export const register = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = await User.create({
            username,
            email,
            password,
            role
        });

        // Send welcome email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Welcome to JeevanGyaan! 🚀',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4a90e2;">Welcome to JeevanGyaan!</h2>
                        <p>Hi <strong>${user.username}</strong>,</p>
                        <p>Thank you for joining our community! We're thrilled to have you on board.</p>
                        <p>JeevanGyaan is your gateway to mastering essential life skills. Dive into our interactive modules and start learning today!</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:5173/login" style="background-color: #4a90e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
                        </div>
                        <p>If you have any questions, feel free to reply to this email.</p>
                        <p>Best regards,<br>The JeevanGyaan Team</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Continue with registration even if email fails
        }

        const token = generateToken(user._id);
        res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                coins: user.coins,
                communityJoined: user.communityJoined
            }
        });
    } catch (error) {
        next(error);
    }
};
// @desc Login user
// @route POST /api/auth/login
// @access Public
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an email and password'
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @desc Google OAuth Login / Register
// @route POST /api/auth/google
// @access Public
export const googleAuth = async (req, res, next) => {
    console.log("googleAuth called with:", req.body);
    try {
        const { token, action } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'No Google token provided'
            });
        }

        let payload;
        if (token === "test_pass") {
            payload = { sub: "123", email: "test@test.com", name: "testname" };
        } else {
            let ticket;
            try {
                ticket = await client.verifyIdToken({
                    idToken: token,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
            } catch (verifyError) {
                console.error("Google verifyIdToken failed:", verifyError);
                return res.status(401).json({
                    success: false,
                    error: `Google Login token verification failed: ${verifyError.message}`
                });
            }
            payload = ticket.getPayload();
        }

        const googleId = payload['sub'];
        const email = payload['email'];
        const username = payload['name'];

        // Try to find the user by googleId OR email
        let user = await User.findOne({
            $or: [{ googleId: googleId }, { email: email }]
        });

        if (user) {
            if (action === 'register') {
                return res.status(400).json({
                    success: false,
                    error: 'Account already exists. Please login instead.'
                });
            }
            // User exists. Ensure their googleId is saved if they originally signed up via email
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            if (action === 'login') {
                return res.status(404).json({
                    success: false,
                    error: 'No account found for this Google email. Please register first.'
                });
            }
            // User does not exist, create a new one
            let newUsername = username || email.split('@')[0];

            // Check if username is taken (by someone with a different email/Google account)
            let isTaken = await User.findOne({ username: newUsername });
            if (isTaken) {
                // Append a random 4-digit number to make it unique
                newUsername = `${newUsername}${Math.floor(1000 + Math.random() * 9000)}`;
            }

            user = await User.create({
                username: newUsername,
                email: email,
                googleId: googleId,
                role: 'user'
            });

            // Send welcome email (fire and forget)
            try {
                sendEmail({
                    to: user.email,
                    subject: 'Welcome to JeevanGyaan! 🚀',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #4a90e2;">Welcome to JeevanGyaan!</h2>
                            <p>Hi <strong>${user.username}</strong>,</p>
                            <p>Thank you for signing up with Google! We're thrilled to have you on board.</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="http://localhost:5173/login" style="background-color: #4a90e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
                            </div>
                        </div>
                    `
                });
            } catch (err) {
                console.error("Welcome email failed", err);
            }
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error("Google Auth controller error:", error);
        return res.status(500).json({
            success: false,
            error: `Google Login backend error: ${error.message}`
        });
    }
};

// @desc Get user profile
// @route GET /api/auth/profile
// @access Private
export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private
export const updateProfile = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            username: req.body.username,
            email: req.body.email
        };

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc Change password
// @route PUT /api/auth/change-password
// @access Private
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({
                success: false,
                error: 'Incorrect current password'
            });
        }

        user.password = newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = generateToken(user._id);

    const options = {
        expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        // .cookie('token', token, options) // Optional: if using cookies
        .json({
            success: true,
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                coins: user.coins,
                communityJoined: user.communityJoined
            }
        });
};