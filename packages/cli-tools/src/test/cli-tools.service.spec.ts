import { Test, TestingModule } from '@one/testing';

import { Command } from '../decorators';
import { CLI_TOOLS_OPTIONS } from '../cli-tools-options';
import { CliToolsService } from '../cli-tools.service';
import { Injectable } from '@one/core';

describe('CliToolsService', () => {
  let module: TestingModule;
  let cliTools: any;

  @Command({ name: 'test' })
  class TestCommand {}

  @Injectable()
  class TestService {}

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        TestCommand,
        TestService,
        {
          provide: CLI_TOOLS_OPTIONS,
          useValue: {},
        },
        CliToolsService,
      ],
    }).compile();

    cliTools = module.get(CliToolsService);
  });

  describe('getCommandProviders', () => {
    it('should return injectables decorated with @Command()', () => {
      const commands = cliTools.getCommandProviders();

      expect(commands).toMatchObject([TestCommand]);
    });
  });
});
