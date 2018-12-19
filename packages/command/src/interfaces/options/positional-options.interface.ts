import { PositionalOptions as YPositional } from 'yargs';
import { ArgvType } from './argv-type.interface';

export interface PositionalOptions extends YPositional, ArgvType {}