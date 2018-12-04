import { InjectionToken } from '../module';
import { Type } from './type.interface';
import { Dependency } from './module';
import { Scopes } from '../constants';

export type Provider =
  | ProvideToken<any>
  | ValueProvider<any>
  | FactoryProvider<any>
  | ExistingProvider<any>
  | ClassProvider<any>
  | Dependency;

export interface ClassProvider<T> extends ProvideToken<any>, MultiProvider {
  useClass: Type<T>;
}

export interface ProvideToken<T> {
  provide: InjectionToken<T> | Type<T>;
}

export interface DepsProvider {
  deps: Dependency[];
}

export interface MultiProvider {
  multi?: boolean;
}

export interface MultiDepsProvider extends DepsProvider, MultiProvider {}

export interface ExistingProvider<T> extends ProvideToken<T> {
  useExisting: Type<T> | InjectionToken<T>;
}

export interface ValueProvider<T> extends ProvideToken<T> {
  useValue: T;
}

export interface FactoryProvider<T>
  extends ProvideToken<T>,
    Partial<DepsProvider>,
    MultiProvider {
  useFactory: (...args: any[]) => T | Promise<T>;
  scope?: Scopes;
}
