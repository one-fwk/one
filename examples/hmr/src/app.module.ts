import { Module } from '@one/core';

import { SecondModule } from './second.module';

@Module({
  imports: [SecondModule],
})
export class AppModule {}
