import { OneContainer } from '../container';
import { Scanner } from '../scanner';
import { Injectable, Module } from '../../decorators';
import { DynamicModule } from '../../interfaces';
import { Registry } from '../../registry';
import { forwardRef } from '../../forward-ref';

describe('Scanner', () => {
  let container: any;
  let scanner: any;

  @Injectable()
  class TestService {}

  @Module({
    providers: [TestService],
    exports: [TestService],
  })
  class TestModule {}

  beforeEach(() => {
    container = new OneContainer();
    scanner = new Scanner(container);
  });

  /*describe('createModules', () => {

  });*/

  describe('scanForModules', () => {
    let isDynamicModuleSpy: jest.SpyInstance;

    beforeEach(() => {
      container.addModule = jest.fn();
      isDynamicModuleSpy = jest.spyOn(Registry, 'isDynamicModule');
    });

    afterEach(() => {
      container.addModule.mockClear();
      isDynamicModuleSpy.mockClear();
    });

    it('should skip on duplicate module imports', async () => {
      @Module()
      class SecondTestModule {}

      @Module({
        imports: [SecondTestModule],
      })
      class ThirdTestModule {}

      @Module({
        imports: [SecondTestModule, ThirdTestModule],
      })
      class TestModule {}

      await scanner.scanForModules(TestModule);

      expect(container.addModule).toHaveBeenCalledTimes(3);

      expect(container.addModule).toHaveBeenNthCalledWith(2, SecondTestModule, [
        TestModule,
      ]);
      expect(container.addModule).toHaveBeenNthCalledWith(3, ThirdTestModule, [
        TestModule,
      ]);
      // expect(scanner.storeModule).not.toHaveBeenNthCalledWith(4, SecondTestModule, [TestModule, SecondTestModule]);
    });

    it('should scan modules without dynamic metadata', async () => {});

    it('should scan modules with dynamic metadata', async () => {
      @Module()
      class SecondTestModule {}

      @Module()
      class ThirdTestModule {}

      @Module({
        imports: [SecondTestModule],
      })
      class TestModule {
        static forRoot(): DynamicModule {
          return {
            module: TestModule,
            imports: [ThirdTestModule],
          };
        }
      }

      await scanner.scanForModules(TestModule.forRoot());
      expect(isDynamicModuleSpy).toHaveNthReturnedWith(1, true);

      expect(container.addModule).toHaveBeenNthCalledWith(2, SecondTestModule, [
        TestModule,
      ]);
      expect(isDynamicModuleSpy).toHaveNthReturnedWith(2, false);

      expect(container.addModule).toHaveBeenNthCalledWith(3, ThirdTestModule, [
        TestModule,
      ]);
      expect(isDynamicModuleSpy).toHaveNthReturnedWith(3, false);

      expect(isDynamicModuleSpy).toHaveBeenCalledTimes(3);
    });

    it('should scan modules with forwardRef', () => {
      // expect(scanner.storeModule).toHaveBeenCalledTimes();
    });
  });

  /*describe('scanModulesForDependencies', () => {

  });*/

  describe('reflectProviders', () => {});
});
