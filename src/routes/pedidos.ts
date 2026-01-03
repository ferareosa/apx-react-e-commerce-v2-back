import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../lib/http-error.js';
import { getSupabaseClient } from '../lib/supabase.js';
import orderRouter from './orders.js';

const router = Router();

const authQuerySchema = z.object({
  email: z.string().email('Necesitamos un email válido'),
  token: z.string().min(20, 'El token recibido es demasiado corto')
});

type TimelineEvent = {
  status?: string;
  note?: string | null;
  checkpoint?: Record<string, unknown> | null;
  at?: string;
};

type TimelinePayload = {
  orderId?: string;
  productId?: string;
  status?: string;
  history?: TimelineEvent[] | null;
};

type TimelineRow = {
  order_id: string;
  total: number | null;
  currency: string | null;
  current_status: string | null;
  payload: TimelinePayload | null;
};

router.get('/', async (req, res, next) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new HttpError(503, 'Supabase no está configurado');
    }

    const { email, token } = authQuerySchema.parse(req.query);
    const normalizedEmail = email.trim().toLowerCase();

    const { data: userResponse, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userResponse.user) {
      throw new HttpError(401, 'Token inválido o expirado');
    }

    const supabaseUser = userResponse.user;
    if (!supabaseUser.email || supabaseUser.email.toLowerCase() !== normalizedEmail) {
      throw new HttpError(403, 'El email no coincide con el token proporcionado');
    }

    const { data, error } = await supabase
      .from('order_timeline')
      .select('order_id, total, currency, current_status, payload')
      .eq('user_id', supabaseUser.id)
      .order('order_id', { ascending: false });

    if (error) {
      throw new HttpError(502, 'No pudimos recuperar tus pedidos', { reason: error.message });
    }

    const items = (data ?? []).map((row) => serializeTimelineRow(row));

    res.json({
      user: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.name ?? null
      },
      total: items.length,
      items
    });
  } catch (error) {
    next(error);
  }
});

function serializeTimelineRow(row: TimelineRow) {
  const payload = row.payload ?? {};
  const history = Array.isArray(payload.history) ? payload.history : [];

  return {
    orderId: payload.orderId ?? row.order_id,
    productId: payload.productId ?? null,
    status: payload.status ?? row.current_status ?? null,
    total: row.total,
    currency: row.currency,
    history: history.map((entry) => ({
      status: entry?.status ?? null,
      note: entry?.note ?? null,
      at: entry?.at ?? null,
      checkpoint: entry?.checkpoint ?? null
    }))
  };
}

router.use(orderRouter);

export default router;
