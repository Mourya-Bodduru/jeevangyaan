import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';

// @desc    Get all community posts
// @route   GET /api/community/posts
// @access  Private
export const getPosts = async (req, res, next) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: posts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new post
// @route   POST /api/community/posts
// @access  Private
export const createPost = async (req, res, next) => {
    try {
        const { title, content } = req.body;
        
        const post = await Post.create({
            title,
            content,
            author: req.user.id
        });

        res.status(201).json({
            success: true,
            data: post
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Like/Unlike a post
// @route   PUT /api/community/posts/:id/like
// @access  Private
export const likePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        // Check if already liked
        const isLiked = post.likes.includes(req.user.id);

        if (isLiked) {
            post.likes = post.likes.filter(id => id.toString() !== req.user.id);
        } else {
            post.likes.push(req.user.id);
        }

        await post.save();

        res.status(200).json({
            success: true,
            data: post.likes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get comments for a post
// @route   GET /api/community/posts/:id/comments
// @access  Private
export const getComments = async (req, res, next) => {
    try {
        const comments = await Comment.find({ post: req.params.id })
            .populate('author', 'username')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            data: comments
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add a comment to a post
// @route   POST /api/community/posts/:id/comments
// @access  Private
export const addComment = async (req, res, next) => {
    try {
        const { content } = req.body;

        const comment = await Comment.create({
            content,
            post: req.params.id,
            author: req.user.id
        });

        const populatedComment = await comment.populate('author', 'username');

        res.status(201).json({
            success: true,
            data: populatedComment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Like/Unlike a comment
// @route   PUT /api/community/comments/:id/like
// @access  Private
export const likeComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ success: false, error: 'Comment not found' });
        }

        const isLiked = comment.likes.includes(req.user.id);

        if (isLiked) {
            comment.likes = comment.likes.filter(id => id.toString() !== req.user.id);
        } else {
            comment.likes.push(req.user.id);
        }

        await comment.save();

        res.status(200).json({
            success: true,
            data: comment.likes
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Join the community by spending coins
// @route   POST /api/community/join
// @access  Private
export const joinCommunity = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (user.communityJoined) {
            return res.status(400).json({ success: false, error: 'You have already joined the community' });
        }

        if (user.coins < 5) {
            return res.status(400).json({ 
                success: false, 
                error: 'Insufficient coins. You need 5 coins to join the community.' 
            });
        }

        // Deduct coins and mark as joined
        user.coins -= 5;
        user.communityJoined = true;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                coins: user.coins,
                communityJoined: user.communityJoined
            }
        });
    } catch (error) {
        next(error);
    }
};
