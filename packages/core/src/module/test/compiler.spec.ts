import { Injectable, Module } from '@one/core';
import { ModuleCompiler } from '../compiler';
import { Registry } from '../../registry';

describe('ModuleCompiler', () => {
  let compiler: any;

  @Module()
  class TestModule {}

  @Injectable()
  class TestService {}

  beforeEach(() => {
    compiler = new ModuleCompiler();
  });

  /*describe('compile', () => {
    it('should compile <Type<OneModule>>', async () => {
      const moduleFactory = await compiler.compile(TestModule);

      expect(moduleFactory).toContainAllEntries([
        ['target', TestModule],
        ['dynamicMetadata', undefined],
        ['token', expect.toBeString()],
      ]);
    });

    it('should compile <InjectionToken>', async () => {});

    it('should compile <DynamicModule>', async () => {
      TestModule.forRoot = () => ({
        module: TestModule,
        exports: [Nest],
      });

      const moduleFactory = await compiler.compile(TestModule.forRoot());

      expect(moduleFactory).toContainEntries([
        ['target', TestModule],
        ['dynamicMetadata', expect.toBeObject()],
        ['token', expect.toBeString()],
      ]);

      expect(moduleFactory.dynamicMetadata).toHaveProperty('exports', [Nest]);
    });

    it('should compile <Promise<DynamicModule>>', async () => {
      const moduleFactory = await compiler.compile(
        Promise.resolve({ module: TestModule }),
      );

      expect(moduleFactory).toContainAllEntries([
        ['target', TestModule],
        ['dynamicMetadata', expect.toBeObject()],
        ['token', expect.toBeString()],
      ]);
    });

    it('should compile <Dependency>', async () => {
      const moduleFactory = await compiler.compile(Nest);

      expect(moduleFactory).toContainAllEntries([
        ['target', Nest],
        ['dynamicMetadata', undefined],
        ['token', expect.toBeString()],
      ]);
    });
  });*/

  describe('extractMetadata', () => {
    let isDynamicModuleSpy: jest.SpyInstance;

    beforeAll(() => {
      isDynamicModuleSpy = jest.spyOn(Registry, 'isDynamicModule');
    });

    afterAll(() => {
      isDynamicModuleSpy.mockClear();
    });

    it('should return with target when Injectable is provided', async () => {
      const moduleFactory = await compiler.extractMetadata(TestService);

      expect(isDynamicModuleSpy).toHaveReturnedWith(false);
      expect(moduleFactory).toMatchObject({
        target: TestService,
      });
    });

    it('should return ModuleFactory when Module is provided', async () => {
      const moduleFactory = await compiler.extractMetadata(TestModule);

      expect(isDynamicModuleSpy).toHaveReturnedWith(false);
      expect(moduleFactory).toMatchObject({
        target: TestModule,
      });
    });

    it('should return ModuleFactory when DynamicModule is provided', async () => {
      const moduleFactory = await compiler.extractMetadata({
        module: TestModule,
      });

      expect(isDynamicModuleSpy).toHaveReturnedWith(true);
      expect(moduleFactory).toMatchObject({
        target: TestModule,
        dynamicMetadata: {},
      });
    });
  });
});
