import { Router } from 'express';
import { z } from 'zod';
import { orderService, productService } from '../container.js';
import { HttpError } from '../lib/http-error.js';
import { authenticate } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/http.js';
import type { ParsedQs } from 'qs';

const router = Router();
router.use(authenticate);

const productIdSchema = z.object({
  productId: z.string().min(1, 'Debes indicar productId')
});

const orderParamsSchema = z.object({
  orderId: z.string().min(1)
});

type CreateOrderBody = { productId?: string };
type CreateOrderQuery = ParsedQs & { productId?: string };

router.post(
  '/',
  async (
    req: AuthenticatedRequest<CreateOrderBody, CreateOrderQuery>,
    res,
    next
  ) => {
  try {
    const merged = {
        productId:
          (req.query.productId as string | undefined) ?? req.body?.productId
      };
      const { productId } = productIdSchema.parse(merged);

    const { order, product } = await orderService.createOrder(
      req.user!.id,
      productId,
      {
        supabaseUserId: req.auth?.supabaseUserId
      }
    );

    res.status(201).json({
      orderId: order.id,
      paymentUrl: order.paymentUrl,
      status: order.status,
      paymentReference: order.paymentReference,
      preferenceId: order.paymentReference,
      product
    });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:orderId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { orderId } = orderParamsSchema.parse(req.params);
    const order = await orderService.getOrder(orderId);

    if (order.userId !== req.user!.id) {
      throw new HttpError(403, 'La orden no pertenece a tu cuenta');
    }

    const product = await productService.getProductById(order.productId);

    res.json({ order, product });
  } catch (error) {
    next(error);
  }
});

export default router;
