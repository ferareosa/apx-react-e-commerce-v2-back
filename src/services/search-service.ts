import { algoliasearch, type Algoliasearch } from 'algoliasearch';
import type { Product } from './database.js';
import { ProductService } from './product-service.js';

class AirtableReplica {
  constructor(private readonly productService: ProductService) {}

  async fetchInventory() {
    return this.productService.listProducts();
  }
}

class AlgoliaReplica {
  search(records: Product[], query: string) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return records;
    }

    const keywords = normalizedQuery.split(/\s+/);

    return records
      .map((product) => ({
        product,
        score: this.scoreProduct(product, keywords)
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);
  }

  private scoreProduct(product: Product, keywords: string[]) {
    const haystack = [
      product.title,
      product.summary,
      product.description,
      product.tags.join(' '),
      product.metadata.category
    ]
      .join(' ')
      .toLowerCase();

    return keywords.reduce((score, keyword) => {
      if (haystack.includes(keyword)) {
        return score + 1;
      }
      return score;
    }, 0);
  }
}

type AlgoliaOptions = {
  appId?: string;
  apiKey?: string;
  indexName?: string;
};

type ProductHit = Product & { objectID: string };

export class SearchService {
  private airtableReplica: AirtableReplica;
  private algoliaReplica: AlgoliaReplica;
  private algoliaClient?: Algoliasearch;
  private algoliaIndexName?: string;
  private readonly algoliaEnabled: boolean;

  constructor(productService: ProductService, algoliaOptions?: AlgoliaOptions) {
    this.airtableReplica = new AirtableReplica(productService);
    this.algoliaReplica = new AlgoliaReplica();
    const hasAlgoliaConfig = Boolean(
      algoliaOptions?.appId && algoliaOptions?.apiKey && algoliaOptions?.indexName
    );

    if (hasAlgoliaConfig) {
      this.algoliaClient = algoliasearch(algoliaOptions!.appId!, algoliaOptions!.apiKey!);
      this.algoliaIndexName = algoliaOptions!.indexName!;
    }

    this.algoliaEnabled = hasAlgoliaConfig;
  }

  isAlgoliaReady() {
    return this.algoliaEnabled && Boolean(this.algoliaClient && this.algoliaIndexName);
  }

  async syncInventoryWithAlgolia() {
    if (!this.algoliaClient || !this.algoliaIndexName) {
      return { synced: false };
    }

    const catalog = await this.airtableReplica.fetchInventory();
    const inStock = catalog.filter((product) => product.stock > 0);
    const payload = inStock.map((product) => ({
      objectID: product.id,
      ...product
    }));

    if (payload.length === 0) {
      await this.algoliaClient.clearObjects({ indexName: this.algoliaIndexName });
      return { synced: true, total: 0 };
    }

    await this.algoliaClient.saveObjects({
      indexName: this.algoliaIndexName,
      objects: payload,
      waitForTasks: true
    });

    return { synced: true, total: payload.length };
  }

  async run(query: string, offset: number, limit: number) {
    const airtableRecords = await this.airtableReplica.fetchInventory();
    const inStockRecords = airtableRecords.filter(
      (record: Product) => record.stock > 0
    );
    const shouldUseAlgolia = Boolean(
      this.algoliaClient &&
        this.algoliaIndexName &&
        query.trim().length > 0
    );

    if (shouldUseAlgolia) {
      const algoliaResult = await this.searchWithAlgolia(query, offset, limit);

      if (algoliaResult) {
        return {
          total: algoliaResult.total,
          items: algoliaResult.items,
          offset,
          limit,
          syncSource: {
            airtableRecords: airtableRecords.length,
            filteredForStock: inStockRecords.length,
            algoliaHits: algoliaResult.total,
            mode: 'algolia'
          }
        };
      }
    }

    const ranked = this.algoliaReplica.search(inStockRecords, query);
    const slice = ranked.slice(offset, offset + limit);

    return {
      total: ranked.length,
      items: slice,
      offset,
      limit,
      syncSource: {
        airtableRecords: airtableRecords.length,
        filteredForStock: inStockRecords.length,
        algoliaHits: ranked.length,
        mode: 'replica'
      }
    };
  }

  private async searchWithAlgolia(query: string, offset: number, limit: number) {
    if (!this.algoliaClient || !this.algoliaIndexName) {
      return null;
    }

    const safeLimit = Math.max(1, Math.min(limit, 50));
    const safeOffset = Math.max(0, offset);
    const trimmed = query.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const response = await this.algoliaClient.search<ProductHit>({
        requests: [
          {
            indexName: this.algoliaIndexName,
            query: trimmed,
            offset: safeOffset,
            length: safeLimit
          }
        ]
      });

      const [result] = response.results;

      if (!result || !('hits' in result)) {
        return null;
      }

      const hits = result.hits.map((hit) => this.fromAlgoliaHit(hit));

      return {
        total: result.nbHits ?? hits.length,
        items: hits
      };
    } catch (error) {
      console.error('Algolia search failed, falling back to replica.', error);
      return null;
    }
  }

  private fromAlgoliaHit(hit: ProductHit) {
    const { objectID: _objectId, ...product } = hit;
    return product as Product;
  }
}
