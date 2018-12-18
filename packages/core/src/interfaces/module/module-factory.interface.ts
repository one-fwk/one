import { Type } from '../type.interface';
import { ModuleMetadata } from './module-metadata.interface';

export interface ModuleFactory {
  target: Type<any>;
  token: string;
  dynamicMetadata?: ModuleMetadata;
}
