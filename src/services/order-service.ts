import { randomUUID } from 'crypto';
import { HttpError } from '../lib/http-error.js';
import { getSupabaseClient } from '../lib/supabase.js';
import type {
  InMemoryDatabase,
  Order,
  OrderHistoryEntry,
  OrderStatus,
  Product
} from './database.js';
import { EmailService } from './email-service.js';
import { MercadoPagoService } from './mercadopago-service.js';
import { NotificationService } from './notification-service.js';
import { ProductService } from './product-service.js';
import { SearchService } from './search-service.js';
import { UserService } from './user-service.js';

export class OrderService {
  constructor(
    private readonly db: InMemoryDatabase,
    private readonly productService: ProductService,
    private readonly mercadoPago: MercadoPagoService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly searchService?: SearchService
  ) {}

  async createOrder(
    userId: string,
    productId: string,
    options: { supabaseUserId?: string } = {}
  ) {
    const user = await this.userService.getById(userId);
    const product = await this.productService.getProductById(productId);
    await this.productService.reserveUnit(productId);
    this.refreshSearchIndex();

    const orderId = randomUUID();
    const preference = await this.mercadoPago.createPaymentPreference(
      user,
      product,
      orderId
    );

    const now = new Date().toISOString();
    const metadata = {
      ...(preference.metadata ?? {}),
      productTitle: product.title,
      productSku: product.sku,
      productSummary: product.summary
    } satisfies Record<string, unknown>;
    const order: Order = {
      id: orderId,
      userId,
      productId,
      currency: product.currency,
      total: product.price,
      status: 'pending-payment',
      paymentProvider: 'mercadopago',
      paymentReference: preference.preferenceId,
      paymentUrl: preference.initPoint,
      metadata,
      history: [
        {
          status: 'pending-payment',
          note: 'Orden creada y enviada a MercadoPago',
          at: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    this.db.saveOrder(order);

    try {
      await this.persistSupabaseOrderOnCreate(order, product, options.supabaseUserId);
    } catch (error) {
      this.db.deleteOrder(order.id);
      await this.productService.releaseUnit(productId);
      this.refreshSearchIndex();
      throw error;
    }

    return { order, product };
  }

  async listOrders(userId: string) {
    return this.db.listOrdersByUser(userId);
  }

  async getOrder(orderId: string) {
    const order = this.db.getOrder(orderId);
    if (!order) {
      throw new HttpError(404, 'Orden no encontrada');
    }
    return order;
  }

  async updateOrderStatus(
    orderId: string,
    providerStatus: string,
    paymentId: string
  ) {
    const order = await this.getOrder(orderId);
    const nextStatus = this.mercadoPago.mapProviderStatus(providerStatus);

    if (order.status === nextStatus) {
      return order;
    }

    order.status = nextStatus;
    order.updatedAt = new Date().toISOString();
    order.paymentReference = paymentId || order.paymentReference;
    order.history = [
      ...order.history,
      this.buildHistoryEntry(nextStatus, `Evento: ${providerStatus}`)
    ];

    this.db.updateOrder(order);

    await this.persistSupabaseStatusUpdate(order, {
      providerStatus,
      paymentId
    });

    if (nextStatus === 'paid') {
      await this.handlePaidOrder(order);
    }

    if (nextStatus === 'failed') {
      await this.productService.releaseUnit(order.productId);
      this.refreshSearchIndex();
    }

    return order;
  }

  private async handlePaidOrder(order: Order) {
    const user = await this.userService.getById(order.userId);
    const product = await this.productService.getProductById(order.productId);

    await this.emailService.sendPaymentConfirmation(user, order, product);
    await this.notificationService.notifyInternalTeam({
      type: 'order.paid',
      orderId: order.id,
      product: product.title,
      value: order.total
    });
  }

  private buildHistoryEntry(status: OrderHistoryEntry['status'], note: string): OrderHistoryEntry {
    return {
      status,
      note,
      at: new Date().toISOString()
    };
  }

  private refreshSearchIndex() {
    if (!this.searchService?.isAlgoliaReady()) {
      return;
    }

    this.searchService
      .syncInventoryWithAlgolia()
      .catch((error) => console.error('[search] No pudimos actualizar Algolia', error));
  }

  private getSupabaseOrThrow() {
    const client = getSupabaseClient();
    if (!client) {
      throw new HttpError(503, 'Supabase no está configurado para registrar órdenes.');
    }
    return client;
  }

  private async persistSupabaseOrderOnCreate(
    order: Order,
    product: Product,
    supabaseUserId?: string
  ) {
    const supabase = this.getSupabaseOrThrow();
    if (!supabaseUserId) {
      throw new HttpError(400, 'No encontramos tu usuario en Supabase para registrar la orden.');
    }

    const { error: upsertError } = await supabase
      .from('orders')
      .upsert(
        {
          id: order.id,
          user_id: supabaseUserId,
          product_id: product.id,
          status: order.status,
          currency: order.currency,
          total: order.total,
          payment_reference: order.paymentReference,
          payment_provider: order.paymentProvider,
          metadata: order.metadata ?? {},
          created_at: order.createdAt,
          updated_at: order.updatedAt
        },
        { onConflict: 'id' }
      );

    if (upsertError) {
      console.error('[supabase] order upsert failed', {
        orderId: order.id,
        userId: order.userId,
        reason: upsertError.message,
        details: upsertError
      });
      throw new HttpError(502, 'No pudimos registrar la orden en Supabase.', {
        reason: upsertError.message
      });
    }

    await this.appendSupabaseEvent(order.id, 'pending-payment', 'Orden creada y enviada a MercadoPago', {
      paymentReference: order.paymentReference,
      initPoint: order.paymentUrl
    }, order.createdAt);
  }

  private async persistSupabaseStatusUpdate(
    order: Order,
    context: { providerStatus: string; paymentId: string }
  ) {
    const supabase = this.getSupabaseOrThrow();

    const { error: upsertError } = await supabase
      .from('orders')
      .upsert(
        {
          id: order.id,
          product_id: order.productId,
          status: order.status,
          currency: order.currency,
          total: order.total,
          payment_reference: order.paymentReference,
          payment_provider: order.paymentProvider,
          metadata: order.metadata ?? {},
          updated_at: order.updatedAt
        },
        { onConflict: 'id' }
      );

    if (upsertError) {
      console.error('[supabase] order status sync failed', {
        orderId: order.id,
        status: order.status,
        reason: upsertError.message,
        details: upsertError
      });
      throw new HttpError(502, 'No pudimos actualizar el estado de la orden en Supabase.', {
        reason: upsertError.message
      });
    }

    await this.appendSupabaseEvent(
      order.id,
      order.status,
      `Estado actualizado desde Mercado Pago (${context.providerStatus})`,
      {
        providerStatus: context.providerStatus,
        paymentId: context.paymentId
      },
      order.updatedAt
    );
  }

  private async appendSupabaseEvent(
    orderId: string,
    status: OrderHistoryEntry['status'],
    note: string,
    checkpoint: Record<string, unknown>,
    happenedAt: string
  ) {
    const supabase = this.getSupabaseOrThrow();
    const { error } = await supabase.from('order_events').insert({
      order_id: orderId,
      status,
      note,
      checkpoint,
      happened_at: happenedAt
    });

    if (error) {
      console.error('[supabase] order event insert failed', {
        orderId,
        status,
        reason: error.message,
        details: error
      });
      throw new HttpError(502, 'No pudimos registrar el evento de la orden en Supabase.', {
        reason: error.message
      });
    }
  }
}
