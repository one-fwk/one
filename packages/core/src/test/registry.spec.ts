import { Registry } from '../registry';
import {
  CircularDependencyException,
  InvalidProviderException,
} from '../errors';
import {
  Module,
  Injectable,
  InjectionToken,
  forwardRef,
  Inject,
} from '@one/core';

describe('Registry', () => {
  @Module()
  class TestModule {}

  @Injectable()
  class TestService {}

  const TEST = new InjectionToken<void>('TEST');

  beforeEach(() => Registry.clearLazyInjects());

  describe('isInjectionToken', () => {
    it('should return true with InjectionToken', () => {
      expect(Registry.isInjectionToken(TEST)).toBeTrue();
    });
    it('should return false with anything else', () => {
      expect(Registry.isInjectionToken(TestService)).toBeFalse();
    });
  });

  describe('isOpaqueToken', () => {
    it('should return true with Injectable', () => {
      expect(Registry.isOpaqueToken(TestService)).toBeTrue();
    });

    it('should return true with InjectionToken', () => {
      expect(Registry.isOpaqueToken(TEST));
    });

    it('should return false with Module', () => {
      expect(Registry.isOpaqueToken(TestModule)).toBeFalse();
    });

    it('should return false with anything else', () => {
      expect(Registry.isOpaqueToken(null as any)).toBeFalse();
    });
  });

  describe('assertProvider', () => {
    it('should throw CircularDependencyException if provider is falsy', () => {
      const error = new CircularDependencyException(undefined as any);

      expect(() => Registry.assertProvider(undefined)).toThrowError(error);
      expect(error).toMatchSnapshot();
    });

    it('should throw InvalidProviderException if invalid provider', () => {
      const error = new InvalidProviderException(TestModule);

      expect(() => Registry.assertProvider(TestModule)).toThrowError(error);
      expect(error).toMatchSnapshot();
    });

    it('should succeed with InjectionToken', () => {
      expect(() => Registry.assertProvider(TEST)).not.toThrow();
    });

    it('should succeed with Injectable', () => {
      expect(() => Registry.assertProvider(TestService)).not.toThrow();
    });
  });

  describe('getLazyInjects', () => {
    it('should get lazy injects', () => {
      const ref = forwardRef(() => Nest);

      @Injectable()
      class Nest {
        @Inject(ref) nest!: Nest;
      }

      const lazyInjects = Registry.getLazyInjects(Nest);
      expect(lazyInjects).toHaveLength(1);
      expect(lazyInjects[0]).toContainAllKeys([
        'target',
        'lazyInject',
        'forwardRef',
      ]);
      expect(lazyInjects[0]).toHaveProperty('target', Nest);
      expect(lazyInjects[0].lazyInject).toBeFunction();
      expect(lazyInjects[0].forwardRef).toContainKey('forwardRef');
      expect(lazyInjects[0].forwardRef.forwardRef).toBeFunction();
    });
  });

  describe('hasForwardRef', () => {
    const forwardRef = () => {};

    it('should have forwardRef', () => {
      expect(
        Registry.hasForwardRef({
          forwardRef,
        }),
      ).toBeTrue();
    });

    it('should not have forwardRef', () => {
      expect(Registry.hasForwardRef(forwardRef)).toBeFalse();
    });
  });

  describe('getForwardRef', () => {
    it('should return Injectable', () => {
      const ref = forwardRef(() => TestService);

      expect(Registry.getForwardRef(ref)).toBe(TestService);
      expect(Registry.getForwardRef(TestService)).toBe(TestService);
    });
  });

  describe('getProviderToken', () => {
    it('should return Token from Injectable', () => {
      const token = Registry.getProviderToken(TestService);

      expect(token).toBe(TestService);
      expect(token).toMatchSnapshot();
    });

    it('should return Token from ProvideToken', () => {
      const token = Registry.getProviderToken({
        provide: TEST,
      });

      expect(token).toEqual(TEST.name);
      expect(token).toMatchSnapshot();
    });

    it('should return Token from InjectionToken', () => {
      const token = Registry.getProviderToken(TEST);

      expect(token).toEqual(TEST.name);
      expect(token).toMatchSnapshot();
    });

    it('should return Token from forwardRef', () => {
      const token = Registry.getProviderToken(forwardRef(() => TestService));

      expect(token).toEqual(TestService);
      expect(token).toMatchSnapshot();
    });
  });

  describe('getToken', () => {
    it('should return Token from Injectable', () => {
      const token = Registry.getToken(TestService);

      expect(token).toBe(TestService);
      expect(token).toMatchSnapshot();
    });

    it('should return Token from InjectionToken', () => {
      const token = Registry.getToken(TEST);

      expect(token).toEqual(TEST.name);
      expect(token).toMatchSnapshot();
    });
  });

  describe('getOpaqueToken', () => {
    it('should return InjectionToken from ProvideToken', () => {
      const token = Registry.getOpaqueToken({
        provide: TEST,
      });

      expect(token).toBe(TEST);
      expect(token).toMatchSnapshot();
    });

    it('should return any', () => {
      const token = Registry.getOpaqueToken(TestService);

      expect(token).toBe(TestService);
      expect(token).toMatchSnapshot();
    });
  });

  describe('getProviderName', () => {
    it('should get name from ForwardRef', () => {
      const name = Registry.getProviderName(forwardRef(() => TestService));

      expect(name).toEqual(TestService.name);
      expect(name).toMatchSnapshot();
    });

    it('should get name from ProvideToken', () => {
      const name = Registry.getProviderName({
        provide: TEST,
      });

      expect(name).toEqual(TEST.name.toString());
      expect(name).toMatchSnapshot();
    });

    it('should get name from InjectionToken', () => {
      const name = Registry.getProviderName(TEST);

      expect(name).toEqual(TEST.name.toString());
      expect(name).toMatchSnapshot();
    });

    it('should get name from Injectable', () => {
      const name = Registry.getProviderName(TestService);

      expect(name).toEqual(TestService.name);
      expect(name).toMatchSnapshot();
    });
  });

  describe('isFactoryProvider', () => {});

  describe('isModule', () => {
    it('should return true when class is decorated with @Module()', () => {
      expect(Registry.isModule(TestModule)).toBeTrue();
    });

    it('should return true with DynamicModule', () => {
      expect(
        Registry.isModule({
          module: TestModule,
        }),
      ).toBeTrue();
    });

    it('should return false with ProvideToken', () => {
      expect(
        Registry.isModule({
          provide: TEST,
        }),
      ).toBeFalse();
    });

    it('should return false with Injectable', () => {
      expect(Registry.isModule(TestService)).toBeFalse();
    });

    it('should return false with InjectionToken', () => {
      expect(Registry.isModule(TEST)).toBeFalse();
    });
  });
});
