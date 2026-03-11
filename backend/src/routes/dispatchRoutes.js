import express from 'express';
const router = express.Router();
import { createDispatch, getDispatches } from '../controllers/dispatchController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/', protect, createDispatch);
router.get('/', protect, getDispatches);

export default router;