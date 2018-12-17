import { InjectionToken } from '../../module';
import { DynamicModule } from './dynamic-module.interface';
import { ForwardRef } from '../forward-ref.interface';
import { Provider } from '../provider.interface';
import { Type } from '../type.interface';

export type ModuleExport<T = any> = Dependency<T> | DynamicModule;
export type OpaqueToken<T = any> = Type<T> | InjectionToken<T>;
export type Dependency<T = any> = OpaqueToken<T> | ForwardRef;
export type ModuleImport =
  | Provider
  | Promise<DynamicModule>
  | DynamicModule
  | Dependency<any>;

export interface ModuleMetadata {
  imports?: ModuleImport[];
  exports?: ModuleExport[];
  providers?: Provider[];
}
