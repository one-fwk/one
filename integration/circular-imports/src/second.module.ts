import { forwardRef, Module } from '@one/core';

import { FirstModule } from './first.module';

@Module({
  imports: [forwardRef(() => FirstModule)],
})
export class SecondModule {}
