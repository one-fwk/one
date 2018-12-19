import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import yargs from 'yargs';
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
import { OptionBuilder, CommandBuilder, PositionalBuilder } from './builders';
import {
  CliToolsOptions,
  PositionalOptions,
  OptionOptions,
  CommandOptions,
} from './interfaces';

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

  private reflectOptionMetadata(instance: Object, propertyKey: string) {
    return Reflector.get<OptionOptions>(OPTION_META, instance, propertyKey)!;
  }

  private reflectPositionalMetadata(instance: Object, propertyKey: string) {
    return Reflector.get<PositionalOptions>(POSITIONAL_META, instance, propertyKey)!;
  }

  private createOptionMetadata(instance: Object): Observable<[string, OptionOptions]> {
    const options = this.explorer.scanForOptions(instance);

    return options.pipe(
      map((propertyKey): [string, OptionOptions] => ([
        propertyKey,
        this.reflectOptionMetadata(instance, propertyKey),
      ])),
    );
  }

  private createPositionalMetadata(instance: Object): Observable<[string, PositionalOptions]> {
    const positionals = this.explorer.scanForPositionals(instance);

    return positionals.pipe(
      map((propertyKey): [string, PositionalOptions] => ([
        propertyKey,
        this.reflectPositionalMetadata(instance, propertyKey),
      ])),
    );
  }

  async onAppInit() {
    const commands = this.getAllCommands();

    commands.forEach(command => {
      const instance = this.container.getProvider(command);

      const commandOptions = Reflector.get<CommandOptions>(COMMAND_META, command)!;
      const builder = new CommandBuilder(instance, commandOptions);

      const positionalMetadata = this.createPositionalMetadata(instance);
      const optionMetadata = this.createOptionMetadata(instance);

      const positionalBuilders = positionalMetadata.pipe(
        map(([key, metadata]) => {
          return new PositionalBuilder(
            instance,
            key,
            metadata,
            builder,
          );
        }),
      );

      const optionBuilders = optionMetadata.pipe(
        map(([key, metadata]) => {
          return new OptionBuilder(
            instance,
            key,
            metadata,
            builder,
          );
        }),
      );

      // builder.addPositionals(positionalMetadata);
      // builder.addOptions(optionMetadata);
    });

    yargs.parse(this.options.args || process.argv);
  }
}
