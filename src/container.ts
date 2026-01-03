import { env } from './config/env.js';
import { InMemoryDatabase } from './services/database.js';
import { AuthService } from './services/auth-service.js';
import { EmailService } from './services/email-service.js';
import { MercadoPagoService } from './services/mercadopago-service.js';
import { NotificationService } from './services/notification-service.js';
import { OrderService } from './services/order-service.js';
import { ProductService } from './services/product-service.js';
import { SearchService } from './services/search-service.js';
import { UserService } from './services/user-service.js';

const database = new InMemoryDatabase();
const emailService = new EmailService();
const notificationService = new NotificationService();
const productService = new ProductService(database);
const userService = new UserService(database);
const mercadoPagoService = new MercadoPagoService();
const searchService = new SearchService(productService, {
  appId: env.algoliaAppId,
  apiKey: env.algoliaApiKey,
  indexName: env.algoliaIndexName
});
const orderService = new OrderService(
  database,
  productService,
  mercadoPagoService,
  emailService,
  notificationService,
  userService,
  searchService
);
const authService = new AuthService(database, emailService, userService);

export {
  authService,
  database,
  emailService,
  mercadoPagoService,
  notificationService,
  orderService,
  productService,
  searchService,
  userService
};
