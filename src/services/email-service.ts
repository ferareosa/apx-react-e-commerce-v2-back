import type { Order, Product, User } from './database.js';

export class EmailService {
  async sendLoginCode(email: string, code: string, expiresAt: Date) {
    console.info('[email] sending login code', { email, code, expiresAt });
    return { email, code, expiresAt };
  }

  async sendPaymentConfirmation(user: User, order: Order, product: Product) {
    console.info('[email] payment confirmed', {
      to: user.email,
      orderId: order.id,
      product: product.title
    });
  }
}
