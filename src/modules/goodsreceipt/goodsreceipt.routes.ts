import { Router } from 'express';
import { GoodsReceiptController } from './goodsreceipt.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();
const controller = new GoodsReceiptController();

// Apply authentication to all routes
router.use(authenticate);

// GET routes
router.get('/', controller.getAll.bind(controller));
router.get('/stats', controller.getStats.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.get('/purchase-order/:purchaseOrderId', controller.getByPurchaseOrder.bind(controller));

// POST routes
router.post('/', controller.create.bind(controller));
router.post('/:id/quality-check', controller.performQualityCheck.bind(controller));
router.post('/:id/approve', controller.approve.bind(controller));

// PUT routes
router.put('/:id', controller.update.bind(controller));
router.put('/:id/items/:itemId', controller.updateItem.bind(controller));

// DELETE routes
router.delete('/:id', controller.delete.bind(controller));

export default router;

