import { OneModule } from '../module';
import { OneContainer } from '../container';
import { Module, Injectable } from '../../decorators';
import { InjectionToken } from '../injection-token';
import { ProviderTypes, Scopes } from '../../constants';
import { MultiProviderException } from '../../errors/exceptions';
import { noop } from '../../util';
import {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  ValueProvider,
} from '../../interfaces';

describe('OneModule', () => {
  let container: OneContainer;
  let module: any;

  @Module()
  class TestModule {}

  @Injectable()
  class TestService {}

  beforeEach(() => {
    container = new OneContainer();
    module = new OneModule(TestModule, [], container);
  });

  describe('getDependencies', () => {});

  describe('bindings', () => {
    describe('bindProviders', () => {
      const TEST = new InjectionToken<void>('TEST');

      beforeEach(() => {
        module.linkRelatedProviders = noop;
        module.getProviderType = noop;
        module.bind = noop;
      });

      it('should throw MultiProviderException if providers with same identifier exists without multi property set', async () => {
        const error = new MultiProviderException(TEST.name.toString());

        module.injectables.add({
          provide: TEST,
        });
        module.injectables.add({
          provide: TEST,
        });

        await expect(module.bindProviders()).rejects.toThrowError(error);
      });

      it('should bind providers with same identifier if multi property is set', async () => {
        const provider = {
          provide: TEST,
          multi: true,
        };

        module.injectables.add(provider);
        module.injectables.add(provider);

        await expect(module.bindProviders()).resolves.not.toThrow();
      });
    });

    describe('bindExistingProvider', () => {
      let provider: any;

      beforeEach(() => {
        module.providers.bind(TestService).toSelf();
        provider = {
          useExisting: TestService,
        };
      });

      it('should be instance of TestService when using token as identifier', () => {
        const TEST = Symbol.for('TestService');

        module.bindExistingProvider(TEST, provider);

        expect(module.providers.get(TEST)).toBeInstanceOf(TestService);
      });

      it('should be instance of TestService when using class as identifier', () => {
        class Test {}

        module.bindExistingProvider(Test, provider);

        expect(module.providers.get(Test)).toBeInstanceOf(TestService);
      });
    });

    describe('bindFactoryProvider', () => {
      const identifier = Symbol.for('FactoryProvider');
      let counter: number;
      let provider: any;

      beforeEach(() => {
        counter = 0;
        provider = {
          useFactory: jest.fn(() => counter++),
        };
      });

      afterEach(() => provider.useFactory.mockClear());

      it('should bind FactoryProvider as singleton', async () => {
        await module.bindFactoryProvider(identifier, provider);

        const firstVal = module.providers.get(identifier);
        const secondVal = module.providers.get(identifier);

        expect(provider.useFactory).toHaveBeenCalledTimes(1);
        expect(firstVal).toEqual(secondVal);
      });

      it('should bind FactoryProvider as transient', async () => {
        provider.scope = Scopes.TRANSIENT;
        await module.bindFactoryProvider(identifier, provider);

        const firstVal = module.providers.get(identifier);
        const secondVal = module.providers.get(identifier);

        expect(provider.useFactory).toHaveBeenCalledTimes(2);
        expect(firstVal).not.toEqual(secondVal);
      });

      it('should bind FactoryProvider as request', async () => {});
    });
  });

  describe('getRelatedProviders', () => {
    let catModule: OneModule;

    @Injectable()
    class CatService {}

    @Module()
    class CatModule {}

    beforeEach(() => {
      catModule = new OneModule(CatModule, [TestModule], container);
    });

    it(`should not have providers which aren't exported`, () => {
      catModule.exports.add(CatService);
      catModule.addProvider(TestService);
      module.addImport(catModule);

      const providers = module.getRelatedProviders();
      expect(providers.size).toBe(1);
      expect(providers.values().next().value).toBe(CatService);
    });

    it('should get deep exported imports/providers', () => {});
  });

  describe('getProviderType', () => {
    it('should get correct provider types', () => {
      const FACTORY_TOKEN = new InjectionToken<void>('FACTORY_TOKEN');
      const VALUE_TOKEN = new InjectionToken<string>('VALUE_TOKEN');
      const EXISTING_TOKEN = new InjectionToken<string>('EXISTING_TOKEN');
      const CLASS_TOKEN = new InjectionToken<TestService>('CLASS_TOKEN');

      expect(module.getProviderType(TestService)).toEqual(
        ProviderTypes.DEFAULT,
      );

      const factoryProvider: FactoryProvider<void> = {
        provide: FACTORY_TOKEN,
        useFactory: () => {},
      };

      expect(module.getProviderType(factoryProvider)).toEqual(
        ProviderTypes.FACTORY,
      );

      const valueProvider: ValueProvider<string> = {
        provide: VALUE_TOKEN,
        useValue: '',
      };

      expect(module.getProviderType(valueProvider)).toEqual(
        ProviderTypes.VALUE,
      );

      const existingProvider: ExistingProvider<string> = {
        provide: EXISTING_TOKEN,
        useExisting: VALUE_TOKEN,
      };

      expect(module.getProviderType(existingProvider)).toEqual(
        ProviderTypes.EXISTING,
      );

      const classProvider: ClassProvider<TestService> = {
        provide: CLASS_TOKEN,
        useClass: TestService,
      };

      expect(module.getProviderType(classProvider)).toEqual(
        ProviderTypes.CLASS,
      );
    });
  });
});
