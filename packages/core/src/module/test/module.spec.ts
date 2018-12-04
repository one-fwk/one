import { OneModule } from '../module';
import { OneContainer } from '../container';
import { Module, Injectable } from '../../decorators';
import { InjectionToken } from '../injection-token';
import { ProviderTypes } from '../../constants';
import {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  ValueProvider,
} from '../../interfaces';

describe('OneModule', () => {
  let module: OneModule;
  let container: OneContainer;

  @Module()
  class TestModule {}

  @Injectable()
  class TestService {}

  beforeEach(() => {
    container = new OneContainer();
    module = new OneModule(TestModule, [], container);
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
      catModule.injectables.add(TestService);
      module.imports.add(catModule);

      const providers: Set<any> = (<any>module).getRelatedProviders();
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

      expect((<any>module).getProviderType(TestService)).toEqual(
        ProviderTypes.DEFAULT,
      );

      const factoryProvider: FactoryProvider<void> = {
        provide: FACTORY_TOKEN,
        useFactory: () => {},
      };

      expect((<any>module).getProviderType(factoryProvider)).toEqual(
        ProviderTypes.FACTORY,
      );

      const valueProvider: ValueProvider<string> = {
        provide: VALUE_TOKEN,
        useValue: '',
      };

      expect((<any>module).getProviderType(valueProvider)).toEqual(
        ProviderTypes.VALUE,
      );

      const existingProvider: ExistingProvider<string> = {
        provide: EXISTING_TOKEN,
        useExisting: VALUE_TOKEN,
      };

      expect((<any>module).getProviderType(existingProvider)).toEqual(
        ProviderTypes.EXISTING,
      );

      const classProvider: ClassProvider<TestService> = {
        provide: CLASS_TOKEN,
        useClass: TestService,
      };

      expect((<any>module).getProviderType(classProvider)).toEqual(
        ProviderTypes.CLASS,
      );
    });
  });
});
