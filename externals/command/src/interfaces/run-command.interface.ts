import { Arguments } from 'yargs';

export interface RunCommand {
  [propertyKey: string]: string | number | boolean | any[];

  run(args: Arguments): Promise<void> | void;
}