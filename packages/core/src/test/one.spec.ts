import { Test } from '@one/testing';
import { forwardRef, Inject, Injectable, Module } from '@one/core';

describe('Integrations', () => {
  describe('it should be able to forward reference imports', async () => {
    @Injectable()
    class SecondService {}

    @Module({
      providers: [SecondService],
      exports: [SecondService],
    })
    class SecondModule {}

    @Injectable()
    class FirstService {
      constructor(readonly second: SecondService) {}
    }

    @Module({
      imports: [SecondModule],
      providers: [FirstService],
      exports: [FirstService],
    })
    class FirstModule {}

    const module = await Test.createTestingModule({
      imports: [
        FirstModule,
        // SecondModule,
      ],
    }).compile();

    expect(module.get(FirstService).second).toBeInstanceOf(SecondService);
    /*expect(module.get(SecondService).first).toBeInstanceOf(FirstService);

    expect(SecondModule).toBe(SecondModule);*/
  });
});
