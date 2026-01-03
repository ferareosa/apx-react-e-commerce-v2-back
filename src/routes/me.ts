import { Router } from 'express';
import { z } from 'zod';
import { orderService, productService, userService } from '../container.js';
import { authenticate } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/http.js';
import type { Order } from '../services/database.js';

const router = Router();
router.use(authenticate);

const profileSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    phone: z.string().min(6).max(32).optional(),
    preferences: z
      .record(z.union([z.string(), z.boolean()]))
      .optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Debes enviar al menos un campo editable'
  });

const addressSchema = z.object({
  street: z.string().min(2),
  number: z.string().min(1).max(10).optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(3),
  country: z.string().min(2),
  reference: z.string().max(140).optional()
});

router.get('/', (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

router.patch('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = profileSchema.parse(req.body);
    const updated = await userService.updateProfile(req.user!.id, body);
    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
});

router.patch('/address', async (req: AuthenticatedRequest, res, next) => {
  try {
    const address = addressSchema.parse(req.body);
    const updated = await userService.updateAddress(req.user!.id, address);
    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
});

router.get('/orders', async (req: AuthenticatedRequest, res, next) => {
  try {
    const orders = await orderService.listOrders(req.user!.id);
    const list = await Promise.all(
      orders.map(async (order: Order) => ({
        order,
        product: await productService.getProductById(order.productId)
      }))
    );

    res.json({ items: list, total: list.length });
  } catch (error) {
    next(error);
  }
});

export default router;
