import 'reflect-metadata';
import { Global, Injectable, Module, OneContainer } from '@one/core';
import { OneModule } from '../module';
import { UnknownModuleException } from '../../errors/exceptions';
import { UnknownModuleMessage } from '../../errors';

describe('OneContainer', () => {
  let container: OneContainer;

  beforeEach(() => {
    container = new OneContainer();
  });

  @Module()
  class TestModule {}

  @Global()
  @Module()
  class GlobalTestModule {}

  describe('addProvider', () => {
    it('should throw UnknownModuleException when module is not stored in collection', () => {
      const token = 'TestModule';
      const error = new UnknownModuleException([token]);

      return expect(container.addProvider({} as any, token)).rejects.toThrow(
        error,
      );
    });
  });

  describe('addImport', () => {});

  describe('addExported', () => {
    it('should throw UnknownModuleException when module is not stored in collection', () => {
      const token = 'TestModule';
      const error = new UnknownModuleException([token]);

      expect(() => container.addExported({} as any, token)).toThrow(error);
    });
  });

  describe('addModule', () => {
    it('should not add module if already exists in collection', async () => {
      const modules = new Map<string, OneModule>();
      const setSpy = jest.spyOn(modules, 'set');
      (<any>container).modules = modules;

      await container.addModule(TestModule, []);
      await container.addModule(TestModule, []);

      expect(setSpy).toHaveBeenCalledTimes(1);
      expect([...modules.entries()]).toMatchSnapshot();
    });

    it('should throw an exception if module is undefined', () => {
      return expect(container.addModule(undefined as any, [])).toThrow();
    });

    it('should add global module when module is global', async () => {
      const addGlobalModuleSpy = jest.spyOn(container, 'addGlobalModule');
      await container.addModule(GlobalTestModule, []);
      expect(addGlobalModuleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('addDynamicMetadata', () => {
    let collection: Map<string, any>;
    let addSpy: jest.SpyInstance;
    const token = 'token';

    beforeEach(() => {
      collection = new Map();
      (<any>container).dynamicModulesMetadata = collection;
      addSpy = jest.spyOn(collection, 'set');
    });

    afterEach(() => addSpy.mockClear());

    describe('when dynamic metadata exists', () => {
      it('should add to the dynamic metadata collection', () => {
        const dynamicMetadata = { module: null };

        (<any>container).addDynamicMetadata(token, dynamicMetadata, []);
        expect(addSpy).toHaveBeenCalledWith(token, dynamicMetadata);
      });
    });

    describe('when dynamic metadata does not exists', () => {
      it('should not add to the dynamic metadata collection', () => {
        (<any>container).addDynamicMetadata(token, null as any, []);
        expect(addSpy).not.toHaveBeenCalled();
      });
    });
  });
});

/*describe('OneContainer', () => {
  let container: OneContainer;

  @Module()
  class TestModule {}

  @Module()
  class TestModule2 {}

  @Injectable()
  class Nest {}

  beforeEach(() => {
    container = new OneContainer();
  });

  describe('getModules', () => {
    let getModuleValuesSpy: jest.SpyInstance;
    let getModuleSpy: jest.SpyInstance;

    beforeEach(() => {
      getModuleValuesSpy = jest.spyOn(container, 'getModuleValues');
      getModuleSpy = jest.spyOn(container, 'getModule');
    });

    afterEach(() => {
      getModuleValuesSpy.mockClear();
      getModuleSpy.mockClear();
    });

    it('should call getModuleValues if nil', async () => {
      await container.addModule(TestModule);
      const modules = (<any>container).getModulesFrom();
      const testModule = container.modules.values().next().value;

      expect(getModuleSpy).not.toHaveBeenCalled();
      expect(getModuleValuesSpy).toHaveBeenCalled();
      expect(modules[0]).toStrictEqual(testModule);
    });

    it('should call getModule if not nil', async () => {
      await container.addModule(TestModule);
      const modules = (<any>container).getModulesFrom(<any>TestModule);
      const testModule = container.modules.values().next().value;

      // Calls with [] ????
      // expect(getModuleValuesSpy).not.toHaveBeenCalled();
      expect(getModuleSpy).toReturnWith(testModule);
      expect(modules[0]).toStrictEqual(testModule);
    });
  });

  describe('isProviderBound', () => {
    it('should check if provider is bound in modules tree', async () => {
      await container.addModule(TestModule);
      const testModule = container.modules.values().next().value;

      await (<any>testModule).bindProvider(<any>Nest);

      expect(container.isProviderBound(Nest)).toBeTrue();
    });

    it('should check if provider is bound in specific module', async () => {
      await container.addModule(TestModule);
      await container.addModule(TestModule2);
      const testModule = container.modules.values().next().value;

      await (<any>testModule).bindProvider(<any>Nest);

      expect(container.isProviderBound(Nest, TestModule2)).toBeFalse();
      expect(container.isProviderBound(Nest, TestModule)).toBeTrue();
    });
  });

  describe('getProvider', () => {
    it('should get provider in nested modules tree', async () => {
      await container.addModule(TestModule);
      await container.addModule(TestModule2);
      const testModule2 = container.getModuleValues()[1];

      await (<any>testModule2).bindProvider(<any>Nest);

      await expect(container.getProvider(Nest, null)).toBeInstanceOf(Nest);
    });

    it('should lookup provider in scope when strict is true', async () => {
      await container.addModule(TestModule);
      const testModule = container.modules.values().next().value;

      await (<any>testModule).bindProvider(<any>Nest);

      expect(
        container.getProvider(Nest, TestModule, {
          strict: true,
        }),
      ).toBeInstanceOf(Nest);
    });

    it('should throw UnknownProviderException if not found', () => {
      const message = new UnknownProviderException(Nest, TestModule);

      expect(() => {
        container.getProvider(Nest, TestModule);
      }).toThrow(message);
    });
  });
});
*/
