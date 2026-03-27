import express from 'express';
import { 
    getPosts, 
    createPost, 
    likePost, 
    getComments, 
    addComment, 
    likeComment,
    joinCommunity
} from '../controllers/communityController.js';
import protect from '../middleware/auth.js';
import { communityGuard } from '../middleware/coinMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/join', joinCommunity);

// Everything below this requires community membership
router.use(communityGuard);

router.route('/posts')
    .get(getPosts)
    .post(createPost);

router.route('/posts/:id/like')
    .put(likePost);

router.route('/posts/:id/comments')
    .get(getComments)
    .post(addComment);

router.route('/comments/:id/like')
    .put(likeComment);

export default router;
