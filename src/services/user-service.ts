import { HttpError } from '../lib/http-error.js';
import type { Address, InMemoryDatabase, User } from './database.js';

export class UserService {
  constructor(private readonly db: InMemoryDatabase) {}

  async ensureUser(email: string, options: { supabaseId?: string } = {}) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.db.getUserByEmail(normalizedEmail);
    if (existing) {
      if (options.supabaseId && existing.supabaseId !== options.supabaseId) {
        const updated: User = {
          ...existing,
          supabaseId: options.supabaseId,
          updatedAt: new Date().toISOString()
        };
        this.db.upsertUser(updated);
        return updated;
      }
      return existing;
    }
    return this.db.createUser(normalizedEmail, {
      id: options.supabaseId,
      supabaseId: options.supabaseId
    });
  }

  async getById(userId: string) {
    const user = this.db.getUserById(userId);
    if (!user) {
      throw new HttpError(404, 'Usuario no encontrado');
    }
    return user;
  }

  async getByEmail(email: string) {
    const user = this.db.getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new HttpError(404, 'Usuario no encontrado para ese email');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    changes: Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt'>>
  ) {
    const user = await this.getById(userId);
    const updated: User = {
      ...user,
      ...changes,
      updatedAt: new Date().toISOString()
    };
    this.db.upsertUser(updated);
    return updated;
  }

  async updateAddress(userId: string, address: Address) {
    const user = await this.getById(userId);
    const updated: User = {
      ...user,
      address,
      updatedAt: new Date().toISOString()
    };
    this.db.upsertUser(updated);
    return updated;
  }
}
