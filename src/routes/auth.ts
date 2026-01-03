import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../container.js';

const router = Router();

const emailSchema = z.object({
  email: z.string().trim().email()
});

const codeSchema = z
  .string()
  .trim()
  .refine((value) => /^\d{6}$/.test(value), {
    message: 'El código debe tener 6 dígitos'
  });

const tokenSchema = z.object({
  email: z.string().trim().email(),
  code: codeSchema
});

router.post('/', async (req, res, next) => {
  try {
    const { email } = emailSchema.parse(req.body);
    const { expiresAt } = await authService.requestCode(email);

    res.status(202).json({
      message: 'Enviamos un código a tu email',
      expiresAt
    });
  } catch (error) {
    next(error);
  }
});

router.post('/token', async (req, res, next) => {
  try {
    const { email, code } = tokenSchema.parse(req.body);
    const token = await authService.exchangeCodeForToken(email, code);
    res.json(token);
  } catch (error) {
    next(error);
  }
});

export default router;
