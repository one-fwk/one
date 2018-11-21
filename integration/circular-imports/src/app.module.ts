import { Module } from '@one/core';

import { FirstModule } from './first.module';
import { SecondModule } from './second.module';

@Module({
  imports: [FirstModule, SecondModule],
})
export class AppModule {}
