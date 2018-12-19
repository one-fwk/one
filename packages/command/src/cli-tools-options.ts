import { InjectionToken, ValueProvider } from '@one/core';

import { CliToolsOptions } from './interfaces';

export const CLI_TOOLS_OPTIONS = new InjectionToken<CliToolsOptions>(
  'CLI_TOOLS_OPTIONS',
);

export function createOptionsProvider(
  options: CliToolsOptions,
): ValueProvider<CliToolsOptions> {
  return {
    provide: CLI_TOOLS_OPTIONS,
    useValue: options,
  };
}
