import { ModuleMetadata } from './module-metadata.interface';
import { Type } from '../type.interface';

export interface DynamicModule<T = any> extends ModuleMetadata {
  module: Type<T>;
}
