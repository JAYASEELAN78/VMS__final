import express from 'express';
const router = express.Router();
import { createInvoice, getInvoices, generateInvoicePDF } from '../controllers/invoiceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.post('/', protect, admin, createInvoice);
router.get('/', protect, getInvoices);
router.get('/:id/pdf', protect, admin, generateInvoicePDF);

export default router;
