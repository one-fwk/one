import yargs, { Arguments, Argv, Options, PositionalOptions } from 'yargs';
import { Reflector } from '@one/core';

import { CommandOptions, OptionsMetadata, PositionalMetadata } from '../interfaces';
import { ArgvType } from '../interfaces/options/argv-type.interface';

export class CommandBuilder<T> {
  private positionalsMeta!: PositionalMetadata;
  private optionsMeta!: OptionsMetadata;
  private builder!: Argv;

  constructor(
    private readonly instance: Object,
    private readonly options: CommandOptions,
  ) {
    yargs.command(options.name, options.describe, (argv: Argv) => {
      this.builder = argv;

      return argv;
    }, (args: Arguments) => this.handle(args));
  }

  private handle(args: Arguments) {
    const metadata: any[] = [...this.positionalsMeta.values(), ...this.optionsMeta.values()];
  }

  private createArgvType(propertyKey: string, options: (ArgvType & any)) {
    const designType = Reflector.getDesignType(this.instance, propertyKey);

    return {
      type: options.type || (<any>designType).name.toLowerCase(),
      name: options.name || propertyKey,
    };
  }

  public addOptions(options: OptionsMetadata) {
    this.optionsMeta = options;

    options.forEach((options, key) => {
      const { type, name } = this.createArgvType(key, options);

      this.builder.option(name, <Options>{
        ...options,
        type,
      });
    });
  }

  public addPositionals(positionals: PositionalMetadata) {
    this.positionalsMeta = positionals;

    positionals.forEach((positional, key) => {
      const { type, name } = this.createArgvType(key, positional);

      this.builder.positional(name, <PositionalOptions>{
        ...positional,
        type,
      });
    });
  }
}