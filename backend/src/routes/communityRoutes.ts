import { Router } from 'express';
import { getTradeIdeas, createTradeIdea, likeTradeIdea, addComment } from '../controllers/communityController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/ideas', getTradeIdeas);
router.post('/ideas', authMiddleware, createTradeIdea);
router.post('/ideas/:id/like', likeTradeIdea);
router.post('/ideas/:id/comments', authMiddleware, addComment);

export default router;
