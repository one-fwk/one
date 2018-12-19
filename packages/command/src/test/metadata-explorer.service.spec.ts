import { Test, TestingModule } from '@one/testing';

import { MetadataExplorerService } from '../metadata-explorer.service';
import { Command, Positional, Option } from '../decorators';

describe('MetadataExplorerService', () => {
  let module: TestingModule;
  let testCommand: TestCommand;
  let explorer: MetadataExplorerService;

  @Command({ name: 'test', describe: 'any' })
  class TestCommand {
    @Positional({}) test1!: string;

    @Option({}) port!: boolean;
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
    it('should return properties decorated with @Positional()', () => {
      const props = explorer.scanForPositionals(testCommand);
      expect([...props]).toMatchObject(['test1']);
    });
  });

  describe('scanForOptions', () => {
    it('should return properties decorated with @Option()', () => {
      const props = explorer.scanForOptions(testCommand);
      expect([...props]).toMatchObject(['test2']);
    });
  });
});