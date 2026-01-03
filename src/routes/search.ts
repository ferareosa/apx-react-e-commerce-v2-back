import { Router } from 'express';
import { z } from 'zod';
import { searchService } from '../container.js';

const router = Router();

const searchSchema = z.object({
  q: z
    .string()
    .trim()
    .optional()
    .default(''),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

router.get('/', async (req, res, next) => {
  try {
    const { q, offset, limit } = searchSchema.parse(req.query);
    const result = await searchService.run(q, offset, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
