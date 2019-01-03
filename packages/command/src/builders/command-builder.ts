import yargs, { Arguments, Argv } from 'yargs';
import { Reflector } from '@one/core';

import { ArgvType, CommandOptions, RunCommand } from '../interfaces';
import { Builder } from './builder';

export class CommandBuilder {
  private builders!: Builder<Required<ArgvType>>[];

  constructor(
    private readonly instance: RunCommand,
    private readonly options: CommandOptions,
  ) {
    yargs.command(
      [options.name, options.alias || ''],
      options.describe || '',
      (argv) => this.build(argv),
      (args) => this.handle(args),
    );
  }

  private build(argv: Argv): Argv {
    this.builders.forEach(({ type, metadata }) => {
      (argv[type] as any)(metadata.name, metadata);
    });

    return argv;
  }

  private async handle(args: Arguments) {
    this.builders.forEach(({ propertyKey, metadata }) => {
      Object.defineProperty(this.instance, propertyKey, {
        value: args[metadata.name],
        writable: false,
      });
    });

    await this.instance.run(args);
  }

  private createMetadata(propertyKey: string, metadata: (ArgvType & any)): ArgvType {
    const designType = Reflector.getDesignType(this.instance, propertyKey);

    return {
      type: metadata.type || (designType as any).name.toLowerCase(),
      name: metadata.name || propertyKey,
      ...metadata,
    };
  }

  public add(builders: Builder<ArgvType>[]) {
    this.builders = builders.map(builder => {
      builder.metadata = this.createMetadata(
        builder.propertyKey,
        builder.metadata,
      );

      return builder as Builder<Required<ArgvType>>;
    });
  }
}