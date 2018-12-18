import { DynamicModule, Module } from '@one/core';

import { CLI_TOOLS_OPTIONS, createOptionsProvider } from './cli-tools-options';
import { CliToolsOptions } from './interfaces';
import { CliToolsService } from './cli-tools.service';

@Module()
export class CliToolsModule {
  static register(options: CliToolsOptions): DynamicModule {
    return {
      module: CliToolsModule,
      exports: [CLI_TOOLS_OPTIONS],
      providers: [createOptionsProvider(options), CliToolsService],
    };
  }
}
