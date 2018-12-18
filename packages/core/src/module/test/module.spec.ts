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
import { Registry } from '../../registry';

describe('OneModule', () => {
  let container: OneContainer;
  let testProvider: FactoryProvider<any>;
  let module: any;

  const TEST = new InjectionToken<void>('TEST');

  @Module()
  class TestModule {}

  @Injectable()
  class TestService {}

  beforeEach(() => {
    container = new OneContainer();
    module = new OneModule(TestModule, [], container);

    testProvider = {
      provide: TEST,
      useFactory: jest.fn(),
    };
  });

  describe('getDependencies', () => {});

  describe('events', () => {
    beforeEach(() => {});

    describe('onModuleInit', () => {
      describe('runOnModuleInit', () => {});
    });

    describe('onModuleDestroy', () => {});

    describe('onAppInit', () => {
      describe('runOnAppInit', () => {});

      describe('factoriesOnAppInit', () => {});

      describe('injectablesOnAppInit', () => {});
    });

    describe('onAppDestroy', () => {});
  });

  describe('bindings', () => {
    const TestSymbol = Symbol.for('TestService');

    describe('bindProviders', () => {
      beforeAll(() => {
        Registry.getProviderToken = jest.fn(() => TEST.name);
      });

      beforeEach(() => {
        module.linkRelatedProviders = noop;
        module.getProviderType = jest.fn(() => ProviderTypes.FACTORY);
        module.bind = jest.fn();
      });

      afterAll(() => {
        (<any>Registry.getProviderToken).mockClear();
      });

      it('bind should be called with right arguments', async () => {
        module.addProvider(testProvider);

        await expect(module.bindProviders()).resolves.not.toThrow();

        expect(module.bind).toHaveBeenCalledWith(
          TEST.name,
          ProviderTypes.FACTORY,
          testProvider,
        );
      });

      it('should throw MultiProviderException if providers with same identifier exists without multi property set', async () => {
        const error = new MultiProviderException(TEST.name.toString());

        module.addProvider(testProvider);
        module.addProvider(testProvider);

        await expect(module.bindProviders()).rejects.toThrowError(error);
      });

      it('should bind providers with same identifier if multi property is set', async () => {
        testProvider.multi = true;

        module.addProvider(testProvider);
        module.addProvider(testProvider);

        await expect(module.bindProviders()).resolves.not.toThrow();
      });
    });

    describe('bindValueProvider', () => {
      it('should bind a string value', () => {
        const useValue = 'Hello World';

        module.bindValueProvider(TestSymbol, { useValue });

        expect(module.injector.get(TestSymbol)).toEqual(useValue);
      });

      it('should bind any value', () => {
        const useValue = undefined;

        module.bindValueProvider(TestSymbol, { useValue });

        expect(module.injector.get(TestSymbol)).toBeUndefined();
      });
    });

    describe('bindExistingProvider', () => {
      let existingProvider: ExistingProvider<TestService>;

      beforeEach(() => {
        module.injector.bind(TestService).toSelf();

        existingProvider = {
          provide: TEST,
          useExisting: TestService,
        };
      });

      it('should be instance of TestService when using token as identifier', () => {
        module.bindExistingProvider(TestSymbol, existingProvider);

        expect(module.injector.get(TestSymbol)).toBeInstanceOf(TestService);
      });

      it('should be instance of TestService when using class as identifier', () => {
        class Test {}

        module.bindExistingProvider(Test, existingProvider);

        expect(module.injector.get(Test)).toBeInstanceOf(TestService);
      });
    });

    describe('bindFactoryProvider', () => {
      const identifier = Symbol.for('FactoryProvider');
      let counter: number;

      beforeEach(() => {
        counter = 0;
        testProvider = {
          provide: TEST,
          useFactory: jest.fn(() => counter++),
        };
      });

      afterEach(() => {
        (<any>testProvider.useFactory).mockClear();
      });

      it('should bind FactoryProvider as singleton', async () => {
        await module.bindFactoryProvider(identifier, testProvider);

        const firstVal = module.injector.get(identifier);
        const secondVal = module.injector.get(identifier);

        expect(testProvider.useFactory).toHaveBeenCalledTimes(1);
        expect(firstVal).toEqual(secondVal);
      });

      it('should bind FactoryProvider as transient', async () => {
        testProvider.scope = Scopes.TRANSIENT;
        await module.bindFactoryProvider(identifier, testProvider);

        const firstVal = module.injector.get(identifier);
        const secondVal = module.injector.get(identifier);

        expect(testProvider.useFactory).toHaveBeenCalledTimes(2);
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
      expect(providers).toMatchSnapshot();
    });

    it('should be able to resolve symbols', () => {
      const TEST = Symbol.for('TEST');

      catModule.exports.add(TEST);
      module.addImport(catModule);

      const providers = module.getRelatedProviders();

      expect(providers.size).toBe(1);
      expect(providers.values().next().value).toBe(TEST);
      expect(providers).toMatchSnapshot();
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
