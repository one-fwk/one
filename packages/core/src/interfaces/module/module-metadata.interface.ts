import { InjectionToken } from '../../module';
import { DynamicModule } from './dynamic-module.interface';
import { ForwardRef } from '../forward-ref.interface';
import { Provider } from '../provider.interface';
import { Type } from '../type.interface';

export type ModuleExport = Dependency | DynamicModule<any>;
export type OpaqueToken<T> = Type<T> | InjectionToken<T>;
export type Dependency = OpaqueToken<any> | ForwardRef;
export type ModuleImport =
  | Provider
  | Promise<DynamicModule<any>>
  | DynamicModule<any>
  | Dependency;

export interface ModuleMetadata {
  imports?: ModuleImport[];
  exports?: ModuleExport[];
  providers?: Provider[];
}
