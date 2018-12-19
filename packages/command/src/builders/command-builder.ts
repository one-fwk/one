import yargs, { Arguments, Argv } from 'yargs';
import { Reflector } from '@one/core';

import { ArgvType, CommandOptions, OptionsMetadata, PositionalMetadata } from '../interfaces';
import { Builder } from './builder';

export class CommandBuilder {
  private positionalsMeta!: PositionalMetadata;
  private optionsMeta!: OptionsMetadata;

  constructor(
    private readonly instance: Object,
    private readonly options: CommandOptions,
  ) {
    yargs.command(
      [options.name, options.alias || ''],
      options.describe!,
      (argv) => this.build(argv),
      (args) => this.handle(args),
    );
  }

  private build(argv: Argv): Argv {
    return argv;
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

  public add(builder: Builder<any>) {

  }

  public addOptions(options: OptionsMetadata) {
    /*this.optionsMeta = options;

    options.forEach((options, key) => {
      const { type, name } = this.createArgvType(key, options);

      this.builder.option(name, <Options>{
        ...options,
        type,
      });
    });*/
  }

  public addPositionals(positionals: PositionalMetadata) {
    /*this.positionalsMeta = positionals;

    positionals.forEach((positional, key) => {
      const { type, name } = this.createArgvType(key, positional);

      this.builder.positional(name, <PositionalOptions>{
        ...positional,
        type,
      });
    });*/
  }
}