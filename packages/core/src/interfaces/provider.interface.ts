import { Type } from './type.interface';
import { Dependency, OpaqueToken } from './module';
import { Scopes } from '../constants';

export type Provider<T = any> =
  // | ProvideToken<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>
  | ClassProvider<T>
  | Dependency;

export interface ClassProvider<T> extends ProvideToken<T>, MultiProvider {
  useClass: Type<T>;
}

export interface ProvideToken<T> {
  provide: OpaqueToken<T>;
}

export interface DepsProvider {
  deps: Dependency[];
}

export interface MultiProvider {
  multi?: boolean;
}

export interface MultiDepsProvider extends DepsProvider, MultiProvider {}

export interface ExistingProvider<T> extends ProvideToken<T> {
  useExisting: OpaqueToken<T>;
}

/*export interface ServiceProvider<T> extends ProvideToken<T> {
  toService:
}*/

export interface ValueProvider<T> extends ProvideToken<T> {
  useValue: T;
}

export interface FactoryProvider<T>
  extends ProvideToken<T>,
    Partial<DepsProvider>,
    MultiProvider {
  useFactory: (...args: any[]) => T;
  scope?: Scopes;
}
