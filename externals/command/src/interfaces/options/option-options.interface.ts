import { Options as YOptions } from 'yargs';
import { ArgvType } from './argv-type.interface';

export interface OptionOptions extends YOptions, ArgvType {}