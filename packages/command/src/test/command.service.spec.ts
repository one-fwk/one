import { Test, TestingModule } from '@one/testing';

import { Command, Option, Positional } from '../decorators';
import { CLI_TOOLS_OPTIONS } from '../cli-tools-options';
import { CommandService } from '../command.service';
import { Injectable } from '@one/core';
import { OptionOptions, PositionalOptions } from '../interfaces';
import { MetadataExplorerService } from '../metadata-explorer.service';

describe('CommandService', () => {
  let module: TestingModule;
  let testCommand: TestCommand;
  let commander: any;

  @Command({ name: 'none', describe: '' })
  class TestCommand {
    @Positional({}) serve!: string;

    @Option({}) port!: boolean;
  }

  @Injectable()
  class TestService {}

  beforeAll(() => {
    jest.mock('../metadata-explorer.service.ts', () => ({
      scanForPositionals: () => (['serve']),
      scanForOptions: () => (['port']),
    }));
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        TestCommand,
        TestService,
        MetadataExplorerService,
        {
          provide: CLI_TOOLS_OPTIONS,
          useValue: {},
        },
        CommandService,
      ],
    }).compile();

    commander = module.get(CommandService);
    testCommand = module.get(TestCommand);
  });

  afterAll(() => {
    jest.unmock('../metadata-explorer.service.ts');
  });

  describe('getAllCommands', () => {
    it('should return injectables decorated with @Command()', () => {
      const commands = commander.getAllCommands();

      expect(commands).toMatchObject([TestCommand]);
    });
  });

  describe('createPositionalMetadata', () => {
    it('should return a IterableIterator<[string, PositionalOptions]> collection', () => {
      const metadata = commander.createPositionalMetadata(testCommand).toArray();

      expect(metadata).toMatchObject([['serve', {}]]);
    });
  });

  describe('createOptionMetadata', () => {
    it('should return an IterableIterator<[string, OptionOptions]> collection', () => {
      const metadata = commander.createOptionMetadata(testCommand).toArray();

      expect(metadata).toMatchObject([['port'], {}]);
    });
  });
});
