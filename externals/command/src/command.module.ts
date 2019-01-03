import { DynamicModule, Module } from '@one/core';

import { CLI_TOOLS_OPTIONS, createOptionsProvider } from './cli-tools-options';
import { CliToolsOptions } from './interfaces';
import { CommandService } from './command.service';

@Module()
export class CommandModule {
  static register(options: CliToolsOptions): DynamicModule {
    return {
      module: CommandModule,
      exports: [CLI_TOOLS_OPTIONS],
      providers: [createOptionsProvider(options), CommandService],
    };
  }
}
