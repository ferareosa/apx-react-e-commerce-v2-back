import { createServer } from './app.js';
import { env } from './config/env.js';
import { searchService } from './container.js';

const app = createServer();

const port = env.port;

if (searchService.isAlgoliaReady()) {
  void searchService
    .syncInventoryWithAlgolia()
    .then((result) => {
      if (result.synced) {
        console.log(
          `[search] ${result.total} productos sincronizados con Algolia (${env.algoliaIndexName})`
        );
      }
    })
    .catch((error) => {
      console.error('[search] No pudimos sincronizar con Algolia al iniciar', error);
    });
} else {
  console.log('[search] Algolia deshabilitado, usando replica local');
}

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});
