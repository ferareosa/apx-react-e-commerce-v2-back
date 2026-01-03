import { randomUUID } from 'crypto';

export type Address = {
  street: string;
  number?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  reference?: string;
};

export type User = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: Address;
  preferences?: Record<string, string | boolean>;
  supabaseId?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthCodeRecord = {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
};

export type OrderStatus =
  | 'pending-payment'
  | 'paid'
  | 'failed'
  | 'in-transit'
  | 'delivered'
  | 'cancelled';

export type OrderEventStatus = OrderStatus | 'packed' | 'shipped';

export type OrderHistoryEntry = {
  status: OrderEventStatus;
  note: string;
  at: string;
};

export type Order = {
  id: string;
  userId: string;
  productId: string;
  status: OrderStatus;
  currency: string;
  total: number;
  paymentProvider: 'mercadopago';
  paymentReference: string;
  paymentUrl: string;
  metadata: Record<string, unknown>;
  history: OrderHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  sku: string;
  title: string;
  summary: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  tags: string[];
  heroImage: string;
  gallery: string[];
  metadata: {
    category: string;
    shippingEstimateDays: number;
    location: string;
    featured: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

export class InMemoryDatabase {
  private users = new Map<string, User>();
  private usersByEmail = new Map<string, string>();
  private authCodes = new Map<string, AuthCodeRecord>();
  private products = new Map<string, Product>();
  private orders = new Map<string, Order>();

  constructor() {
    this.seedProducts();
  }

  upsertUser(user: User) {
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email.toLowerCase(), user.id);
    return user;
  }

  createUser(
    email: string,
    options: {
      id?: string;
      supabaseId?: string;
    } = {}
  ) {
    const timestamp = new Date().toISOString();
    const user: User = {
      id: options.id ?? randomUUID(),
      email,
      supabaseId: options.supabaseId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    return this.upsertUser(user);
  }

  getUserByEmail(email: string) {
    const userId = this.usersByEmail.get(email.toLowerCase());
    if (!userId) {
      return undefined;
    }
    return this.users.get(userId);
  }

  getUserById(id: string) {
    return this.users.get(id);
  }

  saveAuthCode(record: AuthCodeRecord) {
    this.authCodes.set(record.email.toLowerCase(), record);
    return record;
  }

  getAuthCode(email: string) {
    return this.authCodes.get(email.toLowerCase());
  }

  deleteAuthCode(email: string) {
    this.authCodes.delete(email.toLowerCase());
  }

  listProducts() {
    return Array.from(this.products.values());
  }

  getProductById(id: string) {
    return this.products.get(id);
  }

  updateProduct(product: Product) {
    this.products.set(product.id, product);
    return product;
  }

  saveOrder(order: Order) {
    this.orders.set(order.id, order);
    return order;
  }

  updateOrder(order: Order) {
    if (!this.orders.has(order.id)) {
      throw new Error('Order not found');
    }
    this.orders.set(order.id, order);
    return order;
  }

  deleteOrder(orderId: string) {
    this.orders.delete(orderId);
  }

  getOrder(orderId: string) {
    return this.orders.get(orderId);
  }

  listOrdersByUser(userId: string) {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }

  private seedProducts() {
    const timestamp = new Date().toISOString();
    const catalog: Product[] = [
      {
        id: 'prd-drape-dress',
        sku: 'CB-DR-001',
        title: 'Vestido drapeado Azafrán',
        summary: 'Silueta midi con escote halter y espalda descubierta para noches de verano.',
        description:
          'Confeccionado en satén italiano certificado, combina un drapeado frontal que estiliza con espalda descubierta y falda evasé. El forro interior antiestático garantiza libertad de movimiento sin adherencias.',
        price: 580,
        currency: 'USD',
        stock: 18,
        tags: ['halter', 'evento nocturno', 'premium fabrics'],
        heroImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=70',
        gallery: [
          'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=70',
          'https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=900&q=70'
        ],
        metadata: {
          category: 'Vestidos',
          shippingEstimateDays: 5,
          location: 'Orilla Luminosa',
          featured: true
        },
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: 'prd-nocturne-blazer',
        sku: 'CB-BL-208',
        title: 'Blazer cruzado Nocturne',
        summary: 'Lana fría con hombro estructurado y botones nácar ahumado.',
        description:
          'Nuestra sastrería icónica se actualiza con un paño liviano de lana merino y viscosa reciclada. El frente cruzado limpia la silueta y el forro en cupro respirable permite llevarlo sobre tops de seda.',
        price: 490,
        currency: 'USD',
        stock: 32,
        tags: ['sastrería', 'lana fría', 'oficina'],
        heroImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=70',
        gallery: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=70',
          'https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=900&q=70'
        ],
        metadata: {
          category: 'Sastrería',
          shippingEstimateDays: 7,
          location: 'Colección Nocturne',
          featured: true
        },
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: 'prd-luar-shirt',
        sku: 'CB-SH-112',
        title: 'Camisa de seda Luar',
        summary: 'Botones ocultos y puño XL para styling continuo.',
        description:
          'Camisa oversize construida en satén de seda 22 momme con caída líquida. Presenta cartera oculta, ruedo curvo y puños largos que pueden abrocharse doble para un look editorial.',
        price: 320,
        currency: 'USD',
        stock: 41,
        tags: ['oversize', 'sedas', 'genderless'],
        heroImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=70',
        gallery: [
          'https://images.unsplash.com/photo-1521579971123-1192931a1452?auto=format&fit=crop&w=900&q=70',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=70'
        ],
        metadata: {
          category: 'Camisas',
          shippingEstimateDays: 6,
          location: 'Luar Core',
          featured: true
        },
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: 'prd-arena-trench',
        sku: 'CB-TR-411',
        title: 'Trench minimal Arena',
        summary: 'Gabardina repelente al agua con interior desmontable.',
        description:
          'Versión ligera del trench clásico en algodón orgánico con membrana técnica que repele agua y viento. El chaleco interior acolchado se desmonta para adaptar la prenda entre estaciones.',
        price: 720,
        currency: 'USD',
        stock: 15,
        tags: ['impermeable', 'layering', 'travel ready'],
        heroImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=70',
        gallery: [
          'https://images.unsplash.com/photo-1490111718993-d98654ce6cf7?auto=format&fit=crop&w=900&q=70'
        ],
        metadata: {
          category: 'Outerwear',
          shippingEstimateDays: 9,
          location: 'Arena Capsule',
          featured: true
        },
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: 'prd-bruma-knit',
        sku: 'CB-KN-522',
        title: 'Suéter cashmere Bruma',
        summary: 'Cuello bote, hombro caído y punto perlado para máxima suavidad.',
        description:
          'Hecho con cashmere grado A proveniente de la meseta de Alashan, certificado Good Cashmere Standard. El punto perlado crea textura tridimensional mientras que la tintura en prenda aporta matiz único.',
        price: 410,
        currency: 'USD',
        stock: 38,
        tags: ['cashmere', 'capsule wardrobe', 'heirloom quality'],
        heroImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=70',
        gallery: [
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=70'
        ],
        metadata: {
          category: 'Knitwear',
          shippingEstimateDays: 6,
          location: 'Bruma Knit Lab',
          featured: true
        },
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: 'prd-denim-weekend',
        sku: 'CB-DN-305',
        title: 'Denim relajado Weekend',
        summary: 'Tiro alto y pierna recta en sarga italiana con lavado a la piedra.',
        description:
          'Jeans confeccionados en algodón orgánico con un 2% de elastano reciclado para mantener estructura sin perder confort. El proceso de lavado utiliza ozono y reduce un 70% el consumo de agua.',
        price: 260,
        currency: 'USD',
        stock: 52,
        tags: ['denim', 'comfort stretch', 'responsible wash'],
        heroImage: 'https://images.unsplash.com/photo-1503342250614-ca4407868a5b?auto=format&fit=crop&w=900&q=70',
        gallery: [
          'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=70'
        ],
        metadata: {
          category: 'Denim',
          shippingEstimateDays: 4,
          location: 'Weekend Studio',
          featured: false
        },
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ];

    catalog.forEach((product) => this.products.set(product.id, product));
  }
}
