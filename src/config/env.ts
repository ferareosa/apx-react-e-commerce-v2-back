import { config } from 'dotenv';

config();

const resolvedPort = Number.parseInt(process.env.SERVER_PORT ?? process.env.PORT ?? '4000', 10);
const clientBaseUrl = process.env.CLIENT_BASE_URL ?? 'http://localhost:5173';
const serverPublicUrl = process.env.SERVER_PUBLIC_URL ?? `http://localhost:${resolvedPort}`;

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: resolvedPort,
  clientBaseUrl,
  serverPublicUrl,
  authSecret: process.env.AUTH_SECRET ?? 'dev-auth-secret',
  loginCodeTTLMinutes: Number.parseInt(process.env.LOGIN_CODE_TTL ?? '10', 10),
  mercadoPagoWebhookSecret: process.env.MP_WEBHOOK_SECRET ?? 'mp-dev-secret',
  mercadoPagoAccessToken: process.env.MP_ACCESS_TOKEN,
  mercadoPagoPublicKey: process.env.MP_PUBLIC_KEY,
  mercadoPagoSuccessUrl: process.env.MP_SUCCESS_URL ?? `${clientBaseUrl}/checkout/success`,
  mercadoPagoFailureUrl: process.env.MP_FAILURE_URL ?? `${clientBaseUrl}/checkout/failure`,
  mercadoPagoPendingUrl: process.env.MP_PENDING_URL ?? `${clientBaseUrl}/checkout/pending`,
  mercadoPagoNotificationUrl:
    process.env.MP_NOTIFICATION_URL ?? `${serverPublicUrl}/api/webhook/mercadopago`,
  algoliaAppId: process.env.ALGOLIA_APP_ID,
  algoliaApiKey: process.env.ALGOLIA_API_KEY,
  algoliaIndexName: process.env.ALGOLIA_INDEX_NAME,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
};

export { env };
