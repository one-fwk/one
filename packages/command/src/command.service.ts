import yargs from 'yargs';
import { Inject, Injectable, OnAppInit, OneContainer, Reflector, Type } from '@one/core';

import { MetadataExplorerService } from './metadata-explorer.service';
import { CLI_TOOLS_OPTIONS } from './cli-tools-options';
import { COMMAND_META, OPTION_META, POSITIONAL_META } from './tokens';
import { Builder, BuilderType, CommandBuilder } from './builders';
import { CliToolsOptions, CommandOptions, Metadata, OptionOptions, PositionalOptions, RunCommand } from './interfaces';

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

  private reflectOptionMetadata(prototype: object, propertyKey: string) {
    return Reflector.get<OptionOptions>(OPTION_META, prototype, propertyKey)!;
  }

  private reflectPositionalMetadata(prototype: object, propertyKey: string) {
    return Reflector.get<PositionalOptions>(POSITIONAL_META, prototype, propertyKey)!;
  }

  private createOptionMetadata(prototype: object): Metadata<OptionOptions>[] {
    const options = this.explorer.scanForOptions(prototype);

    return options.map(propertyKey => ({
      metadata: this.reflectOptionMetadata(prototype, propertyKey),
      propertyKey,
    }));
  }

  private createPositionalMetadata(prototype: object): Metadata<PositionalOptions>[] {
    const positionals = this.explorer.scanForPositionals(prototype);

    return positionals.map(propertyKey => ({
      metadata: this.reflectPositionalMetadata(prototype, propertyKey),
      propertyKey,
    }));
  }

  onAppInit() {
    const commands = this.getAllCommands();

    commands.forEach(command => {
      const instance = this.container.getProvider<RunCommand>(command);

      const commandOptions = Reflector.get<CommandOptions>(COMMAND_META, command)!;
      const commandBuilder = new CommandBuilder(instance, commandOptions);

      const positionalMetadata = this.createPositionalMetadata(command.prototype);
      const optionMetadata = this.createOptionMetadata(command.prototype);

      const positionalBuilders = positionalMetadata.map(({ propertyKey, metadata }) => {
        return new Builder<PositionalOptions>(
          BuilderType.POSITIONAL,
          propertyKey,
          metadata,
        );
      });

      const optionBuilders = optionMetadata.map(({ propertyKey, metadata }) => {
        return new Builder<OptionOptions>(
          BuilderType.OPTION,
          propertyKey,
          metadata,
        );
      });

      commandBuilder.add([
        ...positionalBuilders,
        ...optionBuilders,
      ]);
    });

    yargs.parse(this.options.args || process.argv);
  }
}
