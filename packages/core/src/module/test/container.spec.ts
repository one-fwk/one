import { Global, Injectable, Module, OneContainer } from '@one/core';
import { Registry } from '../../registry';
import { OneModule } from '../module';
import { InvalidModuleException, UnknownModuleException } from '../../errors';

describe('OneContainer', () => {
  let container: any;

  beforeEach(() => {
    container = new OneContainer();
  });

  @Module()
  class TestModule {}

  @Injectable()
  class TestService {}

  @Global()
  @Module()
  class GlobalTestModule {}

  /*describe('createdModules', () => {
    describe('isModuleCreated', () => {

    });

    describe('addCreatedModule', () => {

    });
  });

  describe('providerTokens', () => {

  });*/

  describe('getModulesFrom', () => {});

  describe('isProviderBound', () => {
    let test: OneModule;
    let globalTest: OneModule;

    beforeEach(() => {
      test = new OneModule(TestModule, [], container);
      globalTest = new OneModule(GlobalTestModule, [], container);

      container.modules.set('test', test);
      container.modules.set('globalTest', globalTest);

      test.injector.bind(TestService).toSelf();
    });

    beforeAll(() => {
      Registry.getToken = jest.fn(() => TestService);
    });

    afterAll(() => {
      (<any>Registry.getToken).mockClear();
    });

    it('should check in all modules', () => {
      container.getModulesFrom = () => [test, globalTest];
      expect(container.isProviderBound(TestService)).toBeTrue();
    });

    it('should check in specific module only', () => {
      container.getModulesFrom = () => [test];
      expect(container.isProviderBound(TestService, TestModule)).toBeTrue();

      container.getModulesFrom = () => [globalTest];
      expect(
        container.isProviderBound(TestService, GlobalTestModule),
      ).toBeFalse();
    });
  });

  describe('getRootModule', () => {
    it('should get first module added', () => {
      const first = new OneModule({} as any, [], container);
      const second = new OneModule({} as any, [], container);

      container.modules.set('first', first);
      container.modules.set('second', second);

      expect(container.getRootModule()).toBe(first);
    });
  });

  describe('addProvider', () => {
    it('should throw UnknownModuleException when module is not stored in collection', () => {
      const token = 'TestModule';
      const error = new UnknownModuleException([token]);

      return expect(container.addProvider(null, token)).rejects.toThrow(error);
    });
  });

  describe('getAllInjectables', () => {
    it('should return injectables from all modules', () => {
      const first = new OneModule(TestModule, [], container);
      const second = new OneModule(GlobalTestModule, [], container);

      container.modules.set('', first);
      container.modules.set(' ', second);

      first.addProvider(TestService);
      second.addProvider({
        provide: {} as any,
      });

      expect(container.getAllInjectables()).toMatchObject([TestService]);
    });
  });

  describe('addImport', () => {});

  describe('addExported', () => {
    it('should throw UnknownModuleException when module is not stored in collection', () => {
      const token = 'TestModule';
      const error = new UnknownModuleException([token]);

      expect(() => container.addExported(null, token)).toThrow(error);
    });
  });

  describe('addModule', () => {
    it('should not add module if already exists in collection', async () => {
      const modulesSetSpy = jest.spyOn(container.modules, 'set');

      await container.addModule(TestModule, []);
      await container.addModule(TestModule, []);

      expect(modulesSetSpy).toHaveBeenCalledTimes(1);
      expect(container.modules).toMatchSnapshot();
    });

    it('should throw an exception if module is undefined', async () => {
      const error = new InvalidModuleException([]);
      await expect(container.addModule(null, [])).rejects.toThrowError(error);
    });

    it('should add global module when module is global', async () => {
      const addGlobalModuleSpy = jest.spyOn(container, 'addGlobalModule');
      await container.addModule(GlobalTestModule, []);
      expect(addGlobalModuleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('addDynamicMetadata', () => {
    let addDynamicModulesMetadataSpy: jest.SpyInstance;
    const token = 'token';

    beforeEach(() => {
      addDynamicModulesMetadataSpy = jest.spyOn(
        container.dynamicModulesMetadata,
        'set',
      );
    });

    afterEach(() => {
      addDynamicModulesMetadataSpy.mockClear();
    });

    describe('when dynamic metadata exists', () => {
      it('should add to the dynamic metadata collection', () => {
        const dynamicMetadata = { module: null };

        container.addDynamicMetadata(token, dynamicMetadata, []);
        expect(addDynamicModulesMetadataSpy).toHaveBeenCalledWith(
          token,
          dynamicMetadata,
        );
      });
    });

    describe('when dynamic metadata does not exists', () => {
      it('should not add to the dynamic metadata collection', async () => {
        await container.addDynamicMetadata(token, null, []);
        expect(addDynamicModulesMetadataSpy).not.toHaveBeenCalled();
      });
    });
  });
});
