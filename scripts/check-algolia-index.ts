// Script para verificar si hay productos en el índice de Algolia desde Node.js
import * as algoliasearch from 'algoliasearch';
import 'dotenv/config';

const appId = process.env.ALGOLIA_APP_ID;
const apiKey = process.env.ALGOLIA_API_KEY;
const indexName = process.env.ALGOLIA_INDEX_NAME;

async function main() {
  if (!appId || !apiKey || !indexName) {
    throw new Error('Faltan variables de entorno de Algolia');
  }
  const client = algoliasearch.algoliasearch(appId, apiKey);
  const res = await client.search([
    { indexName, params: { hitsPerPage: 10 } }
  ]);
  const hits = res.results?.[0]?.hits || [];
  const nbHits = res.results?.[0]?.nbHits || 0;
  console.log('hits:', hits);
  console.log('nbHits:', nbHits);
}

main().catch(console.error);
