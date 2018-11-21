import { OneFactory } from '@one/core';

import { AppModule } from './app.module';

(async () => {
  const app = new OneFactory(AppModule);
  setTimeout(() => process.exit(0), 1000);
  await app.start();
})();
