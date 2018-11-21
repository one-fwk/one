import { forwardRef, Module } from '@one/core';

import { SecondModule } from './second.module';

@Module({
  imports: [forwardRef(() => SecondModule)],
})
export class FirstModule {}
