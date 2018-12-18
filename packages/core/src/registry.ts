import { InjectionToken } from './module';
import { Reflector } from './reflector';
import { isFunc, isObservable, isPromise, isSymbol, isUndef } from './util';
import {
  CircularDependencyException,
  InvalidProviderException,
} from './errors';
import {
  ProvideToken,
  ILazyInject,
  ForwardRef,
  Provider,
  Type,
  FactoryProvider,
  ValueProvider,
  ClassProvider,
  ExistingProvider,
  DynamicModule,
  ModuleImport,
  Token,
  ModuleExport,
  Dependency,
  OpaqueToken,
} from './interfaces';

export class Registry {
  public static readonly lazyInjects = new Set<ILazyInject>();

  public static clearLazyInjects() {
    this.lazyInjects.clear();
  }

  public static getLazyInjects(target: Type | Function): ILazyInject[] {
    return [...this.lazyInjects.values()].filter(
      provider => provider.target === target,
    );
  }

  public static isModule(target: unknown) {
    return this.isDynamicModule(target)
      ? Reflector.isModule(target.module)
      : Reflector.isModule(target);
  }

  public static hasForwardRef(provider: ModuleImport) {
    return provider && isFunc((<ForwardRef>provider).forwardRef);
  }

  public static getForwardRef(provider: ModuleImport) {
    return this.hasForwardRef(provider)
      ? (<ForwardRef>provider).forwardRef()
      : <Type>provider;
  }

  public static getProviderName(provider: Provider) {
    const token = this.getProviderToken(provider);

    return isSymbol(token) ? token.toString() : token.name;
  }

  public static isInjectionToken(
    target: unknown,
  ): target is InjectionToken<any> {
    return target instanceof InjectionToken;
  }

  public static isToken(target: unknown): target is Token {
    return isSymbol(target) || Reflector.isInjectable(target);
  }

  public static isOpaqueToken(target: unknown): target is OpaqueToken<any> {
    return this.isInjectionToken(target) || Reflector.isInjectable(target);
  }

  public static assertProvider(val: unknown, context?: string) {
    if (isUndef(val)) {
      throw new CircularDependencyException(context!);
    }

    if (!this.isOpaqueToken(val)) {
      throw new InvalidProviderException(val);
    }
  }

  public static getProviderToken(provider: Provider): Token {
    const forwardRef = this.getForwardRef(provider);
    const opaqueToken = this.getOpaqueToken(forwardRef);

    return this.getToken(opaqueToken);
  }

  public static getToken(token: OpaqueToken<any>): Token {
    return this.isInjectionToken(token)
      ? (<InjectionToken<any>>token).name
      : <Token>token;
  }

  public static getOpaqueToken(provider: Provider): OpaqueToken<any> {
    return !this.hasProvideToken(provider)
      ? <OpaqueToken<any>>provider
      : provider.provide;
  }

  public static isDynamicModule(module: any): module is DynamicModule {
    return module && !!(<DynamicModule>module).module;
  }

  public static isFactoryProvider(
    provider: Provider,
    scope: string,
  ): provider is FactoryProvider<any> {
    const { useFactory, provide } = <FactoryProvider<any>>provider;

    if (useFactory) {
      const name = this.getProviderName(<any>provide);
      if (isPromise(useFactory) || isObservable(useFactory)) {
        throw new Error(
          `"useFactory" cannot be a Promise or Observable in module ${scope} with ${name}`,
        );
      } else if (!isFunc(useFactory)) {
        throw new Error(
          `"useFactory" must be a function in module ${scope} with ${name}`,
        );
      }

      return true;
    }

    return false;
  }

  public static isValueProvider(
    provider: Provider,
  ): provider is ValueProvider<any> {
    // Should we validate "provide"?
    // useValue can be anything from undefined, null, 0 to ''
    return (<ValueProvider<any>>provider).hasOwnProperty('useValue');
  }

  public static isClassProvider(
    provider: Provider,
    scope: string,
  ): provider is ClassProvider<any> {
    const { useClass, provide } = <ClassProvider<any>>provider;

    if (useClass) {
      const isProvider = this.isOpaqueToken(useClass);

      if (!isProvider) {
        const name = this.getProviderName(provide);
        throw new Error(
          `You must provide a class annotated with @Injectable() in module ${scope} with ${name}`,
        );
      }

      return true;
    }

    return false;
  }

  public static isExistingProvider(
    provider: Provider,
    scope: string,
  ): provider is ExistingProvider<any> {
    // @TODO: Validate "provide" to be instanceof "InjectionToken"
    const { useExisting, provide } = <ExistingProvider<any>>provider;

    if (useExisting) {
      const isProvider = this.isOpaqueToken(useExisting);

      if (!isProvider) {
        const name = this.getProviderName(provide);

        throw new Error(
          `You must provide either an InjectionToken or a class annotated with @Injectable() in module ${scope} with ${name}`,
        );
      }

      return true;
    }

    return false;
  }

  public static hasProvideToken(provider: any): provider is ProvideToken<any> {
    return provider && !!provider.provide;
  }
}
