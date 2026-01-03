import { HttpError } from '../lib/http-error.js';
import type { InMemoryDatabase, Product } from './database.js';

export class ProductService {
  constructor(private readonly db: InMemoryDatabase) {}

  async listProducts() {
    return this.db.listProducts();
  }

  async getProductById(productId: string) {
    const product = this.db.getProductById(productId);
    if (!product) {
      throw new HttpError(404, 'Producto no encontrado');
    }
    return product;
  }

  async reserveUnit(productId: string) {
    const product = await this.getProductById(productId);
    if (product.stock <= 0) {
      throw new HttpError(409, 'Sin stock disponible');
    }
    const updated: Product = {
      ...product,
      stock: product.stock - 1,
      updatedAt: new Date().toISOString()
    };
    this.db.updateProduct(updated);
    return updated;
  }

  async releaseUnit(productId: string) {
    const product = await this.getProductById(productId);
    const updated: Product = {
      ...product,
      stock: product.stock + 1,
      updatedAt: new Date().toISOString()
    };
    this.db.updateProduct(updated);
    return updated;
  }
}
