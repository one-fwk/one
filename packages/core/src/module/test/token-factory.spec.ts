import hash from 'object-hash';

import { ModuleTokenFactory } from '../token-factory';

describe('ModuleTokenFactory', () => {
  let factory: any;

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

    it('should include dynamic metadata', () => {});
  });

  describe('getDynamicMetadataToken', () => {
    it('should return hash when metadata exists', () => {
      const metadata = {};
    });

    it(`should return empty string when metadata doesn't exist`, () => {});
  });

  describe('getScopeStack', () => {
    it('should map metatypes to the array with last metatype', () => {
      class Metatype1 {}
      class Metatype2 {}

      const scopeStack = factory.getScopeStack([Metatype1, Metatype2]);
      expect(scopeStack).toEqual([Metatype2.name]);
    });
  });
});
