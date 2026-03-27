import UserRequest from '../models/UserRequest.js';
import User from '../models/User.js';
import sendEmail from '../utils/emailService.js';

// @desc    Create a new user request
// @route   POST /api/requests
// @access  Private
export const createRequest = async (req, res) => {
    try {
        const { queryInfo, reason, requiredThings } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const newRequest = await UserRequest.create({
            userId: user._id,
            userEmail: user.email,
            queryInfo,
            reason,
            requiredThings
        });

        res.status(201).json({
            success: true,
            data: newRequest,
            message: 'Request submitted successfully'
        });
    } catch (error) {
        console.error('Error in createRequest:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all user requests
// @route   GET /api/requests
// @access  Private/Admin
export const getAllRequests = async (req, res) => {
    try {
        const requests = await UserRequest.find({}).populate('userId', 'username email').sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Error in getAllRequests:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Admin reply to a request
// @route   POST /api/requests/:id/reply
// @access  Private/Admin
export const replyToRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { replyMessage } = req.body;

        const userRequest = await UserRequest.findById(id).populate('userId', 'username email');

        if (!userRequest) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Send email to user
        const emailOptions = {
            to: userRequest.userEmail,
            subject: 'Reply to your JeevanGyaan Request',
            html: `
                <h3>Hello ${userRequest.userId.username},</h3>
                <p>An admin has replied to your recent request/query regarding: <strong>${userRequest.queryInfo}</strong></p>
                <div style="padding: 15px; border-left: 4px solid #4ade80; background-color: #f3f4f6; margin: 20px 0;">
                    <p style="white-space: pre-wrap;">${replyMessage}</p>
                </div>
                <p>Best regards,<br>The JeevanGyaan Team</p>
            `
        };

        await sendEmail(emailOptions);

        // Delete the request after successful reply as per requirements
        await UserRequest.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Reply sent successfully and request removed'
        });

    } catch (error) {
        console.error('Error in replyToRequest:', error);
        res.status(500).json({ success: false, message: 'Server Error. Could not send reply.' });
    }
};
