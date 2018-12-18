import { Reflector, Type } from '@one/core';

describe('Reflector', () => {
  let Nest: Type<any>;

  beforeEach(() => {
    Nest = class {};
  });

  describe('isInjectable', () => {
    it('should not throw error if target is undefined', () => {
      expect(() => Reflector.isInjectable(undefined)).not.toThrow();
    });
  });

  describe('get', () => {
    it('should get metadata', () => {
      Reflect.defineMetadata('NEST', 'nest', Nest);
      expect(Reflector.get('NEST', Nest)).toEqual('nest');
    });
  });

  describe('set', () => {
    it('should set metadata', () => {
      Reflector.set('NEST', 'nest', Nest);
      expect(Reflect.getMetadata('NEST', Nest)).toEqual('nest');
    });
  });

  describe('has', () => {
    it('should have metadata', () => {
      Reflect.defineMetadata('NEST', 'nest', Nest);
      expect(Reflector.has('NEST', Nest)).toBeTruthy();
    });
  });

  describe('defineByKeys', () => {
    it('should define metadata by keys', () => {
      const ONE = 'ONE';
      const TWO = 'TWO';

      Reflector.defineByKeys(
        {
          [ONE]: 'one',
          [TWO]: 'two',
        },
        Nest,
      );

      expect(Reflect.getMetadata(ONE, Nest)).toEqual('one');
      expect(Reflect.getMetadata(TWO, Nest)).toEqual('two');
    });
  });
});
