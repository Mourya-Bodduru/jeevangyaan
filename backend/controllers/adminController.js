import User from '../models/User.js';
import Module from '../models/Module.js';

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
export const getAnalytics = async (req, res, next) => {
    try {
        const userCount = await User.countDocuments();
        const moduleCount = await Module.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                users: userCount,
                modules: moduleCount
            }
        });
    } catch (error) {
        next(error);
    }
};
