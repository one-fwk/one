import * as hash from 'object-hash';

import { ModuleTokenFactory } from '../module-token-factory';

describe('ModuleTokenFactory', () => {
  let factory: ModuleTokenFactory;

  beforeEach(() => {
    factory = new ModuleTokenFactory();
  });

  describe('create', () => {
    class Module {}

    it('should force global scope when it is not set', () => {
      const scope = 'global';
      const token = factory.create(Module, [Module]);

      expect(token).toStrictEqual(
        hash({
          module: Module.name,
          dynamic: '',
          scope,
        }),
      );
    });
  });
});
