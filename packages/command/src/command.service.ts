import { iterate } from 'iterare';
import {
  Inject,
  Injectable,
  OnAppInit,
  Type,
  OneContainer,
  Reflector,
} from '@one/core';

import { MetadataExplorerService } from './metadata-explorer.service';
import { CLI_TOOLS_OPTIONS } from './cli-tools-options';
import { COMMAND_META, OPTION_META, POSITIONAL_META } from './tokens';
import {
  CliToolsOptions,
  PositionalOptions,
  OptionOptions,
  CommandOptions, PositionalMetadata, OptionsMetadata,
} from './interfaces';
import { CommandBuilder } from './builders';

@Injectable()
export class CommandService implements OnAppInit {
  constructor(
    private readonly explorer: MetadataExplorerService,
    private readonly container: OneContainer,
    @Inject(CLI_TOOLS_OPTIONS)
    private readonly options: CliToolsOptions,
  ) {}

  private getAllCommands(): Type<any>[] {
    return this.container.getAllInjectables()
      .filter(injectable => Reflector.has(COMMAND_META, injectable));
  }

  private getOptionMetadata(instance: Object, propertyKey: string) {
    return Reflector.get<OptionOptions>(OPTION_META, instance, propertyKey)!;
  }

  private getPositionalMetadata(instance: Object, propertyKey: string) {
    return Reflector.get<PositionalOptions>(POSITIONAL_META, instance, propertyKey)!;
  }

  private createPositionalMetadata(instance: Object): PositionalMetadata {
    const positionals = this.explorer.scanForPositionals(instance);

    return iterate(positionals).map((propertyKey): any => ([
      propertyKey,
      this.getPositionalMetadata(instance, propertyKey),
    ])).toMap();
  }

  private createOptionMetadata(instance: Object): OptionsMetadata {
    const options = this.explorer.scanForOptions(instance);

    return iterate(options).map((propertyKey): any => ([
      propertyKey,
      this.getOptionMetadata(instance, propertyKey),
    ])).toMap();
  }

  async onAppInit() {
    const commands = this.getAllCommands();

    commands.forEach(command => {
      const instance = this.container.getProvider(command);

      const commandOptions = Reflector.get<CommandOptions>(COMMAND_META, command)!;
      const builder = new CommandBuilder(instance, commandOptions);

      const positionalMetadata = this.createPositionalMetadata(instance);
      const optionMetadata = this.createOptionMetadata(instance);

      builder.addPositionals(positionalMetadata);
      builder.addOptions(optionMetadata);
    });
  }
}
