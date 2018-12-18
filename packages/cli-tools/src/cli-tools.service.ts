import {
  Reflector,
  Inject,
  Injectable,
  OnAppInit,
  OneContainer,
  Type,
} from '@one/core';

import { CLI_TOOLS_OPTIONS } from './cli-tools-options';
import { CliToolsOptions } from './interfaces';
import { COMMAND } from './tokens';

@Injectable()
export class CliToolsService implements OnAppInit {
  constructor(
    private readonly container: OneContainer,
    @Inject(CLI_TOOLS_OPTIONS)
    private readonly options: CliToolsOptions,
  ) {}

  private getCommandProviders() {
    return this.container.getAllInjectables().filter(injectable => {
      return Reflector.has(COMMAND, injectable);
    });
  }

  async onAppInit() {
    const commands = this.getCommandProviders();
  }
}
