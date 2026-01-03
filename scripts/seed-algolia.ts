import 'dotenv/config';
import * as algoliasearch from 'algoliasearch';
import { randomUUID } from 'node:crypto';

const appId = process.env.ALGOLIA_APP_ID;
const apiKey = process.env.ALGOLIA_API_KEY;
const indexName = process.env.ALGOLIA_INDEX_NAME;

if (!appId || !apiKey || !indexName) {
  throw new Error('Necesitás definir ALGOLIA_APP_ID, ALGOLIA_API_KEY y ALGOLIA_INDEX_NAME para correr este seed.');
}

type ApparelRecord = {
  objectID: string;
  sku: string;
  title: string;
  summary: string;
  description: string;
  price: number;
  currency: 'USD' | 'ARS';
  categories: string[];
  color: {
    name: string;
    hex: string;
  };
  palette: string[];
  sizes: Array<{
    label: string;
    available: boolean;
    measurements: Partial<Record<'bust' | 'waist' | 'hips' | 'length' | 'sleeve', number>>;
  }>;
  materials: string[];
  care: string[];
  season: string[];
  gender: string[];
  fit: 'regular' | 'oversized' | 'tailored';
  stock: number;
  heroImage: string;
  gallery: string[];
  tags: string[];
  shipping: {
    region: string;
    leadTimeDays: number;
    method: string;
  };
  metadata: {
    collection: string;
    drop: string;
    occasion: string[];
  };
  createdAt: string;
  updatedAt: string;
};

const now = new Date().toISOString();

const apparelRecords: ApparelRecord[] = [
  // ...solo productos de indumentaria, hardware y packaging eliminados...
  {
    objectID: 'look-drape-dress',
    sku: 'CB-DR-001',
    title: 'Vestido drapeado Azafrán',
    summary: 'Silueta midi con escote halter y espalda descubierta para noches de verano.',
    description:
      'Confeccionado en satén italiano certificado, combina un drapeado frontal que estiliza con espalda descubierta y falda evasé. El forro interior antiestático garantiza libertad de movimiento sin adherencias.',
    price: 580,
    currency: 'USD',
    categories: ['vestidos', 'resort', 'evening'],
    color: { name: 'Azafrán', hex: '#E99C2E' },
    palette: ['#F6D188', '#E99C2E', '#3B1C0F'],
    sizes: [
      { label: 'XS', available: true, measurements: { bust: 80, waist: 62, hips: 88 } },
      { label: 'S', available: true, measurements: { bust: 84, waist: 66, hips: 92 } },
      { label: 'M', available: true, measurements: { bust: 88, waist: 70, hips: 96 } },
      { label: 'L', available: false, measurements: { bust: 94, waist: 76, hips: 102 } }
    ],
    materials: ['78% satén de seda', '22% viscosa certificada EcoVero'],
    care: ['Lavado en seco', 'Plancha tibia del revés', 'Guardar colgado'],
    season: ['SS25'],
    gender: ['femme'],
    fit: 'regular',
    stock: 18,
    heroImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=70',
      'https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=900&q=70'
    ],
    tags: ['halter', 'evento nocturno', 'premium fabrics'],
    shipping: {
      region: 'Latam + US',
      leadTimeDays: 5,
      method: 'Box boutique con funda reutilizable'
    },
    metadata: {
      collection: 'Orilla Luminosa',
      drop: 'Resort 2025',
      occasion: ['coctel', 'casamientos civiles', 'verano urbano']
    },
    createdAt: now,
    updatedAt: now
  },
  {
    objectID: 'blazer-nocturne',
    sku: 'CB-BL-208',
    title: 'Blazer cruzado Nocturne',
    summary: 'Lana fría con hombro estructurado y botones nácar ahumado.',
    description:
      'Nuestra sastrería icónica se actualiza con un paño liviano de lana merino y viscosa reciclada. El frente cruzado limpia la silueta y el forro en cupro respirable hace que pueda usarse incluso sobre tops de seda.',
    price: 490,
    currency: 'USD',
    categories: ['sastrería', 'blazers'],
    color: { name: 'Azul tinta', hex: '#0C1C2B' },
    palette: ['#0C1C2B', '#1C3557', '#C9D3E0'],
    sizes: [
      { label: '36', available: true, measurements: { bust: 84, waist: 64, hips: 90 } },
      { label: '38', available: true, measurements: { bust: 88, waist: 68, hips: 94 } },
      { label: '40', available: true, measurements: { bust: 92, waist: 72, hips: 98 } },
      { label: '42', available: true, measurements: { bust: 96, waist: 76, hips: 102 } }
    ],
    materials: ['62% lana merino certificada RWS', '32% viscosa reciclada', '6% elastano'],
    care: ['Limpieza en seco', 'Cepillar con peine de ropa', 'Ventilar colgado entre usos'],
    season: ['FW24', 'All year'],
    gender: ['femme'],
    fit: 'tailored',
    stock: 32,
    heroImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=70',
      'https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=900&q=70'
    ],
    tags: ['sastrería', 'lana fría', 'oficina'],
    shipping: {
      region: 'Global',
      leadTimeDays: 7,
      method: 'Traje plegado en bolsa antiarrugas'
    },
    metadata: {
      collection: 'Nocturne',
      drop: 'Pre-Fall',
      occasion: ['executive', 'after office']
    },
    createdAt: now,
    updatedAt: now
  },
  {
    objectID: 'silk-shirt-luar',
    sku: 'CB-SH-112',
    title: 'Camisa de seda Luar',
    summary: 'Botones ocultos y puño XL para styling continuo.',
    description:
      'Camisa oversize construida en satén de seda 22 momme con caída líquida. Presenta cartera oculta, ruedo curvo y puños largos que pueden abrocharse doble para un look editorial.',
    price: 320,
    currency: 'USD',
    categories: ['camisas', 'básicos elevados'],
    color: { name: 'Perla fría', hex: '#F3F4F6' },
    palette: ['#F3F4F6', '#C2C8D4', '#1F2933'],
    sizes: [
      { label: 'XS/S', available: true, measurements: { bust: 110, waist: 108, length: 74, sleeve: 63 } },
      { label: 'M/L', available: true, measurements: { bust: 118, waist: 116, length: 76, sleeve: 64 } }
    ],
    materials: ['100% seda mulberry certificada Bluesign'],
    care: ['Lavado a mano en agua fría', 'Secar extendida', 'Plancha vapor media'],
    season: ['All year'],
    gender: ['unisex'],
    fit: 'oversized',
    stock: 41,
    heroImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1521579971123-1192931a1452?auto=format&fit=crop&w=900&q=70',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=70'
    ],
    tags: ['oversize', 'sedas', 'genderless'],
    shipping: {
      region: 'Latam + EU',
      leadTimeDays: 6,
      method: 'Caja rígida + papel de seda compostable'
    },
    metadata: {
      collection: 'Luar',
      drop: 'Core Collection',
      occasion: ['studio days', 'viaje']
    },
    createdAt: now,
    updatedAt: now
  },
  {
    objectID: 'trench-arena',
    sku: 'CB-TR-411',
    title: 'Trench minimal Arena',
    summary: 'Gabardina repelente al agua con interior desmontable.',
    description:
      'Versión ligera del trench clásico en algodón orgánico con membrana técnica que repele agua y viento suave. El chaleco interior acolchado se desmonta para adaptar la prenda entre estaciones.',
    price: 720,
    currency: 'USD',
    categories: ['outerwear', 'trench'],
    color: { name: 'Arena mineral', hex: '#C6B59F' },
    palette: ['#C6B59F', '#F6F1E8', '#2F2519'],
    sizes: [
      { label: 'XS', available: true, measurements: { bust: 92, waist: 88, hips: 98, length: 112 } },
      { label: 'S', available: true, measurements: { bust: 98, waist: 94, hips: 104, length: 114 } },
      { label: 'M', available: true, measurements: { bust: 104, waist: 100, hips: 110, length: 116 } }
    ],
    materials: ['74% algodón orgánico', '26% nylon reciclado', 'Forro: cupro + poliéster reciclado'],
    care: ['Lavado en seco', 'Quitar relleno antes de limpiar', 'Secar a la sombra'],
    season: ['FW24', 'Pre Spring'],
    gender: ['unisex'],
    fit: 'oversized',
    stock: 15,
    heroImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1490111718993-d98654ce6cf7?auto=format&fit=crop&w=900&q=70'
    ],
    tags: ['impermeable', 'layering', 'travel ready'],
    shipping: {
      region: 'Global',
      leadTimeDays: 9,
      method: 'Caja rígida + bolsa anti-polvo oversize'
    },
    metadata: {
      collection: 'Arena',
      drop: 'Storm Capsule',
      occasion: ['commute', 'viajes']
    },
    createdAt: now,
    updatedAt: now
  },
  {
    objectID: 'cashmere-bruma',
    sku: 'CB-KN-522',
    title: 'Suéter cashmere Bruma',
    summary: 'Cuello bote, hombro caído y punto perlado para máxima suavidad.',
    description:
      'Hecho con cashmere grado A proveniente de la meseta de Alashan, certificado Good Cashmere Standard. El punto perlado crea textura tridimensional mientras que la tintura en prenda le da un matiz único.',
    price: 410,
    currency: 'USD',
    categories: ['knits', 'sweaters'],
    color: { name: 'Bruma', hex: '#B3C2C8' },
    palette: ['#B3C2C8', '#EFF3F6', '#4A5562'],
    sizes: [
      { label: 'XS', available: true, measurements: { bust: 98, waist: 94, length: 62 } },
      { label: 'S', available: true, measurements: { bust: 104, waist: 100, length: 63 } },
      { label: 'M', available: true, measurements: { bust: 110, waist: 106, length: 64 } },
      { label: 'L', available: true, measurements: { bust: 116, waist: 112, length: 65 } }
    ],
    materials: ['100% cashmere GCS'],
    care: ['Lavado a mano con jabón neutro', 'Secar extendido', 'Guardar doblado'],
    season: ['FW24'],
    gender: ['unisex'],
    fit: 'oversized',
    stock: 38,
    heroImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=70'
    ],
    tags: ['cashmere', 'capsule wardrobe', 'heirloom quality'],
    shipping: {
      region: 'Américas + Europa',
      leadTimeDays: 6,
      method: 'Caja rígida con bolsa de algodón orgánico'
    },
    metadata: {
      collection: 'Bruma',
      drop: 'Knit Lab',
      occasion: ['relaxed office', 'weekend getaway']
    },
    createdAt: now,
    updatedAt: now
  }
];

async function main() {
  const client = algoliasearch.algoliasearch(appId, apiKey);

  console.info('[algolia] Reemplazando objetos en', indexName);
  const payload = apparelRecords.map((record) => ({
    ...record,
    objectID: record.objectID || randomUUID()
  }));

  await client.saveObjects({ indexName, objects: payload });
  console.info(`[algolia] Seed completo. Publicamos ${payload.length} artículos.`);
}

main().catch((error) => {
  console.error('[algolia] Seed falló', error);
  process.exitCode = 1;
});
