import { Module } from '@one/core';

import { CatService } from './cat.service';
import { DogService } from './dog.service';

@Module({
  providers: [CatService, DogService],
})
export class AppModule {}
