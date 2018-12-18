import { OneFactory } from '@one/core';

import { AppModule } from './app.module';

(async () => {
  const app = new OneFactory(AppModule);
  await app.start();
})();
