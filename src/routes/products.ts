import { Router } from 'express';
import { z } from 'zod';
import { productService } from '../container.js';

const router = Router();
const paramsSchema = z.object({ id: z.string().min(1) });

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = paramsSchema.parse(req.params);
    const product = await productService.getProductById(id);
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

export default router;
