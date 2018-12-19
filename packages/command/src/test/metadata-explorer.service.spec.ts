import { Test, TestingModule } from '@one/testing';
import { toArrayPromise } from '@one/core';

import { MetadataExplorerService } from '../metadata-explorer.service';
import { Command, Positional, Option } from '../decorators';

describe('MetadataExplorerService', () => {
  let module: TestingModule;
  let testCommand: TestCommand;
  let explorer: MetadataExplorerService;

  @Command({ name: 'serve', describe: 'any' })
  class TestCommand {
    @Positional() day!: string;

    @Option() port!: boolean;
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        TestCommand,
        MetadataExplorerService,
      ],
    }).compile();

    explorer = module.get(MetadataExplorerService);
    testCommand = module.get<TestCommand>(TestCommand);
  });

  describe('scanForPositionals', () => {
    it('should return properties decorated with @Positional()', async () => {
      const props = await toArrayPromise(explorer.scanForPositionals(testCommand));
      expect(props).toMatchObject(['day']);
    });
  });

  describe('scanForOptions', () => {
    it('should return properties decorated with @Option()', async () => {
      const props = await toArrayPromise(explorer.scanForOptions(testCommand));
      expect(props).toMatchObject(['port']);
    });
  });
});