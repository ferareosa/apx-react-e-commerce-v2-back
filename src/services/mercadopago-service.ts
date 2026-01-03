import { MercadoPagoConfig, Preference } from 'mercadopago';
import { env } from '../config/env.js';
import type { OrderStatus, Product, User } from './database.js';

export class MercadoPagoService {
  private readonly preferenceClient: Preference;

  constructor() {
    if (!env.mercadoPagoAccessToken) {
      throw new Error('Mercado Pago access token is not configured');
    }

    const config = new MercadoPagoConfig({
      accessToken: env.mercadoPagoAccessToken,
      options: {
        timeout: 5000
      }
    });

    this.preferenceClient = new Preference(config);
  }

  async createPaymentPreference(user: User, product: Product, orderId: string) {
    const metadata = {
      orderId,
      productId: product.id,
      email: user.email
    } satisfies Record<string, unknown>;

    let response;

    const backUrls: {
      success?: string;
      failure?: string;
      pending?: string;
    } = {};

    if (env.mercadoPagoSuccessUrl) {
      backUrls.success = env.mercadoPagoSuccessUrl;
    }
    if (env.mercadoPagoFailureUrl) {
      backUrls.failure = env.mercadoPagoFailureUrl;
    }
    if (env.mercadoPagoPendingUrl) {
      backUrls.pending = env.mercadoPagoPendingUrl;
    }

    const shouldSendBackUrls = Object.keys(backUrls).length > 0;

    try {
      const body: Record<string, unknown> = {
        external_reference: orderId,
        items: [
          {
            id: product.id,
            title: product.title,
            description: product.summary,
            picture_url: product.heroImage,
            quantity: 1,
            currency_id: product.currency,
            unit_price: Number(product.price)
          }
        ],
        payer: {
          email: user.email,
          name: user.name,
          phone: user.phone ? { number: user.phone } : undefined,
          address: user.address
            ? {
                street_name: user.address.street,
                street_number: user.address.number
                  ? Number.parseInt(user.address.number, 10) || undefined
                  : undefined,
                zip_code: user.address.zipCode
              }
            : undefined
        },
        metadata
      };

      if (shouldSendBackUrls) {
        body.back_urls = backUrls;
        if (backUrls.success?.startsWith('https://')) {
          body.auto_return = 'approved';
        }
      }

      if (env.mercadoPagoNotificationUrl) {
        body.notification_url = env.mercadoPagoNotificationUrl;
      }

      response = await this.preferenceClient.create({
        body
      });
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Mercado Pago rechazó la preferencia';
      throw new Error(`mercadopago.preference.create failed: ${message}`);
    }

    const initPoint = response.init_point ?? response.sandbox_init_point;
    if (!response.id || !initPoint) {
      throw new Error('Mercado Pago returned an invalid preference response');
    }

    return {
      preferenceId: response.id,
      initPoint,
      metadata
    };
  }

  mapProviderStatus(status: string): OrderStatus {
    if (status === 'approved') {
      return 'paid';
    }
    if (status === 'rejected') {
      return 'failed';
    }
    return 'pending-payment';
  }

  validateWebhookSignature(signature?: string) {
    if (!signature) {
      return false;
    }
    return signature === env.mercadoPagoWebhookSecret;
  }
}
