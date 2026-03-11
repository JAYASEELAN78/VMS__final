import express from 'express';
import multer from 'multer';
import path from 'path';

// Store files in the backend/uploads directory
const upload = multer({ dest: 'uploads/' });

const router = express.Router();
import { createOrder, getOrders, getOrderById, updateOrder, deleteOrder } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/', protect, upload.single('designFile'), createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id', protect, updateOrder);
router.delete('/:id', protect, deleteOrder);

export default router;