import { Router } from 'express';
import { z } from 'zod';
import { mercadoPagoService, orderService } from '../container.js';
import { HttpError } from '../lib/http-error.js';

const router = Router();

const webhookSchema = z.object({
  orderId: z.string().min(1),
  status: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().optional()
});

router.post('/mercadopago', async (req, res, next) => {
  try {
    const payload = webhookSchema.parse(req.body);
    const incomingSignature =
      typeof req.headers['x-signature'] === 'string'
        ? req.headers['x-signature']
        : payload.signature;

    if (!mercadoPagoService.validateWebhookSignature(incomingSignature)) {
      throw new HttpError(401, 'Firma de MercadoPago inválida');
    }

    const order = await orderService.updateOrderStatus(
      payload.orderId,
      payload.status,
      payload.paymentId
    );

    res.json({
      orderId: order.id,
      status: order.status
    });
  } catch (error) {
    next(error);
  }
});

export default router;
