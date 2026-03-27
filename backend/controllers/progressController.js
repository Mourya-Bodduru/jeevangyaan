import Module from '../models/Module.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import translate from 'google-translate-api-x';

// @desc    Get progress stats by category
// @route   GET /api/progress/categories
// @access  Private
export const getCategoryProgress = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // 1. Get total modules count per category
        const modules = await Module.find({}, 'category');
        const totalModulesByCategory = {};

        modules.forEach(m => {
            const cat = m.category || 'Uncategorized';
            totalModulesByCategory[cat] = (totalModulesByCategory[cat] || 0) + 1;
        });

        // 2. Get user's completed modules
        // We need to populate module to get the category
        const completedProgress = await Progress.find({
            user: userId,
            isCompleted: true
        }).populate('module', 'category');

        const completedModulesByCategory = {};

        completedProgress.forEach(p => {
            if (p.module) { // Check if module still exists
                const cat = p.module.category || 'Uncategorized';
                completedModulesByCategory[cat] = (completedModulesByCategory[cat] || 0) + 1;
            }
        });

        // 3. Calculate percentage and translate categories
        const progressData = [];
        const lang = req.query.lang || 'en';

        for (const [category, total] of Object.entries(totalModulesByCategory)) {
            const completed = completedModulesByCategory[category] || 0;
            const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

            let translatedCat = category;
            if (lang !== 'en') {
                try {
                    translatedCat = (await translate(category, { to: lang })).text;
                } catch (e) {
                    console.error("Category translation error:", e);
                }
            }

            progressData.push({
                category: translatedCat,
                originalCategory: category,
                total,
                completed,
                percentage
            });
        }

        res.status(200).json({
            success: true,
            data: progressData
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Mark a module as complete
// @route   POST /api/progress/mark-complete
// @access  Private
export const markModuleComplete = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { moduleId } = req.body;

        if (!moduleId) {
            return res.status(400).json({ success: false, error: 'Module ID is required' });
        }

        let progress = await Progress.findOne({ user: userId, module: moduleId });

        if (progress) {
            progress.isCompleted = true;
            progress.lastAccessed = Date.now();
        } else {
            progress = new Progress({
                user: userId,
                module: moduleId,
                isCompleted: true,
                lastAccessed: Date.now()
            });
        }

        let coinAwardedNow = false;
        if (!progress.coinAwarded) {
            progress.coinAwarded = true;
            coinAwardedNow = true;
            
            // Increment user coins
            await User.findByIdAndUpdate(userId, { $inc: { coins: 1 } });
        }

        await progress.save();

        // Get updated user to return final coin count
        const updatedUser = await User.findById(userId).select('coins');

        res.status(200).json({
            success: true,
            data: progress,
            coinAwarded: coinAwardedNow,
            totalCoins: updatedUser.coins
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Check completion status of a module
// @route   GET /api/progress/status/:moduleId
// @access  Private
export const checkModuleStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { moduleId } = req.params;

        const progress = await Progress.findOne({ user: userId, module: moduleId });

        res.status(200).json({
            success: true,
            isCompleted: progress ? progress.isCompleted : false
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all progress for current user (for dashboard/list views)
// @route   GET /api/progress/user-progress
// @access  Private
export const getUserProgress = async (req, res, next) => {
    try {
        const progress = await Progress.find({ user: req.user.id });

        // Convert to map for easy lookup: { moduleId: { isCompleted, quizScore } }
        const progressMap = {};
        progress.forEach(p => {
            progressMap[p.module] = {
                isCompleted: p.isCompleted,
                quizScore: p.quizScore,
                attempts: p.attempts
            };
        });

        res.status(200).json({
            success: true,
            data: progressMap
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get leaderboard data
// @route   GET /api/progress/leaderboard
// @access  Private
export const getLeaderboard = async (req, res, next) => {
    try {
        const leaderboard = await Progress.aggregate([
            {
                $group: {
                    _id: '$user',
                    totalScore: { $sum: '$quizScore' },
                    modulesCompleted: {
                        $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    _id: 1,
                    totalScore: 1,
                    modulesCompleted: 1,
                    username: '$userDetails.username',
                    email: '$userDetails.email',
                    role: '$userDetails.role'
                }
            },
            {
                $sort: { totalScore: -1 }
            },
            {
                $limit: 50 // Top 50 users
            }
        ]);

        res.status(200).json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        next(error);
    }
};
