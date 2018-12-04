import { InjectionToken } from './module';
import { Reflector } from './reflector';
import { isFunc, isObservable, isPromise, isSymbol } from './util';
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
} from './interfaces';

export class Registry {
  public static readonly lazyInjects = new Set<ILazyInject>();

  public static clearLazyInjects() {
    this.lazyInjects.clear();
  }

  public static getLazyInjects(target: Type<any>): ILazyInject[] {
    return [...this.lazyInjects.values()].filter(
      provider => provider.target === target,
    );
  }

  public static isModule(target: any) {
    return this.isDynamicModule(target)
      ? Reflector.isModule((<DynamicModule>target).module)
      : Reflector.isModule(target);
  }

  public static hasForwardRef(provider: any) {
    return provider && isFunc((<ForwardRef>provider).forwardRef);
  }

  public static getForwardRef(provider: ModuleImport) {
    return Registry.hasForwardRef(provider)
      ? (<ForwardRef>provider).forwardRef()
      : provider;
  }

  public static getProviderName(provider: Provider) {
    const token = this.getProviderToken(provider);

    return isSymbol(token) ? token.toString() : token.name;
  }

  public static isInjectionToken(
    provider: any,
  ): provider is InjectionToken<any> {
    return provider instanceof InjectionToken;
  }

  public static getInjectionToken(provider: any): Token {
    return this.isInjectionToken(provider)
      ? (<InjectionToken<any>>provider).name
      : <Type<any>>provider;
  }

  public static isProvider(
    provider: any,
  ): provider is InjectionToken<any> | Type<any> {
    return this.isInjectionToken(provider) || Reflector.isInjectable(provider);
  }

  public static assertProvider(
    val: any,
    context?: string,
  ): Type<any> | InjectionToken<any> {
    if (!val) throw new CircularDependencyException(context!);

    if (!this.isProvider(val)) {
      throw new InvalidProviderException(val);
    }

    return val;
  }

  public static getProviderToken(
    provider: Token | ModuleImport | ModuleExport,
  ): Token {
    return !isSymbol(provider)
      ? this.getInjectionToken(
          (<ProvideToken<any>>provider).provide || provider,
        )
      : provider;
  }

  public static isDynamicModule(module: any): module is DynamicModule {
    return !!(<DynamicModule>module).module;
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
      const isProvider = this.isProvider(useClass);

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
      const isProvider = this.isProvider(useExisting);

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

  public static hasProvideToken(
    provider: Provider,
  ): provider is ProvideToken<any> {
    return !!(<ProvideToken<any>>provider).provide;
  }
}
