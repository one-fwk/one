import { OneModule } from '../module';
import { OneContainer } from '../container';
import { Inject, Module, Injectable } from '../../decorators';
import { InjectionToken } from '../injection-token';
import { ProviderTypes, Scopes } from '../../constants';
import { MultiProviderException, UnknownExportException } from '../../errors';
import { Injector, MODULE_REF } from '../../tokens';
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
    const TEST = Symbol.for('TestService');

    describe('bindProviders', () => {
      const TEST = new InjectionToken<void>('TEST');

      beforeEach(() => {
        module.linkRelatedProviders = noop;
        module.getProviderType = noop;
        module.bind = noop;
      });

      it('should throw MultiProviderException if providers with same identifier exists without multi property set', async () => {
        const error = new MultiProviderException(TEST.name.toString());

        module.addProvider({ provide: TEST });
        module.addProvider({ provide: TEST });

        await expect(module.bindProviders()).rejects.toThrowError(error);
      });

      it('should bind providers with same identifier if multi property is set', async () => {
        const provider = {
          provide: TEST,
          multi: true,
        };

        module.addProvider(provider);
        module.addProvider(provider);

        await expect(module.bindProviders()).resolves.not.toThrow();
      });
    });

    describe('bindValueProvider', () => {
      it('should bind a string value', () => {
        const useValue = 'Hello World';

        module.bindValueProvider(TEST, { useValue });

        expect(module.injector.get(TEST)).toEqual(useValue);
      });

      it('should bind any value', () => {
        const useValue = undefined;

        module.bindValueProvider(TEST, { useValue });

        expect(module.injector.get(TEST)).toBeUndefined();
      });
    });

    describe('bindExistingProvider', () => {
      let provider: any;

      beforeEach(() => {
        module.injector.bind(TestService).toSelf();
        provider = {
          useExisting: TestService,
        };
      });

      it('should be instance of TestService when using token as identifier', () => {
        module.bindExistingProvider(TEST, provider);

        expect(module.injector.get(TEST)).toBeInstanceOf(TestService);
      });

      it('should be instance of TestService when using class as identifier', () => {
        class Test {}

        module.bindExistingProvider(Test, provider);

        expect(module.injector.get(Test)).toBeInstanceOf(TestService);
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

        const firstVal = module.injector.get(identifier);
        const secondVal = module.injector.get(identifier);

        expect(provider.useFactory).toHaveBeenCalledTimes(1);
        expect(firstVal).toEqual(secondVal);
      });

      it('should bind FactoryProvider as transient', async () => {
        provider.scope = Scopes.TRANSIENT;
        await module.bindFactoryProvider(identifier, provider);

        const firstVal = module.injector.get(identifier);
        const secondVal = module.injector.get(identifier);

        expect(provider.useFactory).toHaveBeenCalledTimes(2);
        expect(firstVal).not.toEqual(secondVal);
      });

      it('should bind FactoryProvider as request', async () => {});
    });
  });

  describe('validateExported', () => {
    @Module()
    class AnotherTestModule {}

    it('should return token if provider exists', () => {
      const spy = jest.spyOn(module, 'providerContainerHasToken');

      module.addProvider(TestService);

      expect(module.validateExported(TestService, TestService)).toBe(
        TestService,
      );
      expect(spy).toHaveReturnedWith(true);
    });

    it('should return token if module import exists', () => {
      const anotherTestModuleRef = new OneModule(
        AnotherTestModule,
        [],
        container,
      );

      module.addImport(anotherTestModuleRef);

      expect(
        module.validateExported(AnotherTestModule, AnotherTestModule),
      ).toBe(AnotherTestModule);
    });

    it('should throw UnknownExportException if export is not part of imports', () => {
      const error = new UnknownExportException(
        module.target.name,
        AnotherTestModule.name,
      );

      expect(() =>
        module.validateExported(AnotherTestModule, AnotherTestModule),
      ).toThrowError(error);
    });
  });

  describe('addGlobalProviders', () => {
    it('should bind global providers to module', () => {
      @Module()
      class AnotherTestModule {
        constructor(
          readonly container: OneContainer,
          readonly injector: Injector,
          @Inject(MODULE_REF)
          readonly moduleRef: OneModule,
        ) {}
      }

      module = new OneModule(AnotherTestModule, [], container);
      module.addGlobalProviders();

      expect(module.injector.get(Injector)).toBe(module.injector);
      expect(module.injector.get(MODULE_REF.name)).toBe(module);
      expect(module.injector.get(OneContainer)).toBe(module.container);

      module.injector.bind(AnotherTestModule).toSelf();

      const anotherTestModule = module.injector.get(AnotherTestModule);
      expect(anotherTestModule.container).toBe(module.container);
      expect(anotherTestModule.injector).toBe(module.injector);
      expect(anotherTestModule.moduleRef).toBe(module);
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

    it('should be able to resolve Symbol', () => {});

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
