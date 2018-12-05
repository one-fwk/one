import { Container } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

import { Injector, MODULE_INIT, ONE_MODULE } from '../tokens';
import { ProviderTypes, Scopes } from '../constants';
import { OneContainer } from './container';
import { Reflector } from '../reflector';
import { Registry } from '../registry';
import { createDeferredPromise, series } from '../util';
import {
  MultiProviderException,
  UnknownExportException,
  UnknownProviderException,
} from '../errors';
import {
  ClassProvider,
  Dependency,
  ExistingProvider,
  FactoryProvider,
  ModuleExport,
  ModuleImport,
  MultiDepsProvider,
  OnModuleInit,
  Provider,
  Token,
  Type,
  ValueProvider,
} from '../interfaces';

export class OneModule {
  public readonly imports = new Set<OneModule>();
  // @TODO: Rename "injectables" to "providers"
  public readonly injectables = new Set<Provider>();
  // @TODO: Rename "providers" to "injector"
  public readonly providers = new Container({ skipBaseClassChecks: true });
  public readonly lazyInject = getDecorators(this.providers).lazyInject;
  public readonly exports = new Set<Token>();
  public readonly created = createDeferredPromise();
  private readonly factoryValues = new Map<Token, any>();

  constructor(
    public readonly target: Type<any>,
    public readonly scope: Type<any>[],
    public readonly container: OneContainer,
  ) {}

  public addImport(relatedModule: OneModule) {
    this.imports.add(relatedModule);
  }

  public addProvider(provider: Provider) {
    this.injectables.add(provider);
  }

  private providerContainerHasToken(token: Token) {
    return [...this.injectables.values()].some(
      provider => Registry.getProviderToken(provider) === token,
    );
  }

  private validateExported(token: Token, exported: ModuleExport) {
    if (this.providerContainerHasToken(token)) return token;

    const imported = [...this.imports.values()];
    const importedRefNames = <any[]>imported
      .filter(item => item)
      .map(({ target }) => target)
      .filter(target => target);

    if (!importedRefNames.includes(token)) {
      throw new UnknownExportException(
        this.target.name,
        (<Type<any>>exported).name,
      );
    }

    return token;
  }

  public addExported(exported: ModuleExport) {
    const addExportedUnit = (token: Token) => {
      this.exports.add(this.validateExported(token, exported));
    };

    if (Registry.isDynamicModule(exported)) {
      return addExportedUnit(exported.module);
    }

    addExportedUnit(Registry.getProviderToken(exported));
  }

  public getProviders() {
    return [
      // Injector and OneContainer are global providers
      Injector,
      OneContainer,
      ONE_MODULE,
      ...this.injectables.values(),
      ...this.getRelatedProviders().values(),
    ];
  }

  private linkRelatedProviders() {
    const providers = this.getRelatedProviders();

    providers.forEach(provider => {
      const ref = this.container.getProvider(provider, this.target);

      this.providers.bind(provider).toConstantValue(ref);
    });
  }

  private getRelatedProviders() {
    const providerScope = new Set<Token>();

    const find = (type: OneModule | Dependency | Token) => {
      // type = Registry.getForwardRef(<Dependency>type);

      if (Reflector.isInjectable(type) || Registry.isInjectionToken(type)) {
        providerScope.add(<Token>type);
      } else if (type instanceof OneModule) {
        for (const related of (<OneModule>type).exports) {
          const ref = this.container.hasModule(<Type<OneModule>>related)
            ? this.container.getModule(<Type<OneModule>>related)
            : related;

          find(ref!);
        }
      } else {
        throw new Error('Invalid type');
      }
    };

    for (const related of this.imports) {
      find(related);
    }

    return providerScope;
  }

  private async bindProviders() {
    this.linkRelatedProviders();

    for (const provider of this.injectables) {
      const token = Registry.getProviderToken(provider);

      const isMulti = (<MultiDepsProvider>provider).multi;
      if (!isMulti && this.container.providerTokens.includes(token)) {
        const name = Registry.getProviderName(provider);
        throw new MultiProviderException(name);
      }

      this.container.providerTokens.push(token);
      const type = this.getProviderType(provider);
      await this.bind(token, type, provider);
    }
  }

  public replace(toReplace: Dependency, options: any) {
    this.addProvider({
      provide: <any>toReplace,
      ...options,
    });
  }

  public async create() {
    if (this.providers.isBound(this.target)) {
      throw new Error('Tried to create the same module twice');
    }

    await this.bindProviders();

    this.providers.bind(this.target).toSelf();
    const module = this.providers.get<OnModuleInit>(this.target);

    module.onModuleInit && (await module.onModuleInit());

    await series(
      this.container.getAllProviders<Promise<any>>(MODULE_INIT, this.target),
    );

    this.created.resolve();
  }

  private getProviderType(provider: Provider) {
    const module = this.target.name;

    if (Reflector.isInjectable(provider)) {
      return ProviderTypes.DEFAULT;
    }
    if (Registry.isFactoryProvider(provider, module)) {
      return ProviderTypes.FACTORY;
    } else if (Registry.isValueProvider(provider)) {
      return ProviderTypes.VALUE;
    } else if (Registry.isClassProvider(provider, module)) {
      return ProviderTypes.CLASS;
    } else if (Registry.isExistingProvider(provider, module)) {
      return ProviderTypes.EXISTING;
    }

    throw new Error('');
  }

  public getProvider(ref: ModuleImport): Token {
    const token = Registry.getProviderToken(<Provider>ref);
    const provider = <any>(
      this.getProviders().find(provider => provider === token)
    );
    if (!provider) throw new UnknownProviderException(<any>ref, this.target);
    return provider;
  }

  private getDependencies(dependencies: ModuleImport[] = []) {
    return Promise.all(
      dependencies.map(dependency => {
        const ref = Registry.getForwardRef(dependency);
        Registry.assertProvider(ref);

        const provider = this.getProvider(ref);
        return this.container.getProvider(provider, this.target);
      }),
    );
  }

  private async bindFactoryProvider(
    token: Token,
    provider: FactoryProvider<any>,
  ) {
    const deps = await this.getDependencies(provider.deps);

    return this.providers.bind(token).toFactory(() => {
      if (
        !this.factoryValues.has(token) ||
        provider.scope === Scopes.TRANSIENT
      ) {
        this.factoryValues.set(token, provider.useFactory(...deps));
      }

      return this.factoryValues.get(token);
    });
  }

  private bindProvider(provider: Type<any>, scope?: Scopes) {
    const binding = this.providers.bind(provider).toSelf();

    switch (scope) {
      case Scopes.TRANSIENT:
        return binding.inTransientScope();

      case Scopes.REQUEST:
        return binding.inRequestScope();

      // case Scopes.SINGLETON:
      default:
        return binding.inSingletonScope();
    }
  }

  private bindClassProvider(token: Token, provider: ClassProvider<any>) {
    return this.providers.bind(token).to(provider.useClass);
  }

  private bindValueProvider(token: Token, provider: ValueProvider<any>) {
    return this.providers.bind(token).toConstantValue(provider.useValue);
  }

  private bindExistingProvider(token: Token, provider: ExistingProvider<any>) {
    const existingToken = Registry.getOpaqueToken(provider.useExisting);
    const existing = this.providers.get(existingToken);
    return this.providers.bind(token).toConstantValue(existing);
  }

  public async bind(token: Token, type: ProviderTypes, provider: Provider) {
    if (type === ProviderTypes.DEFAULT) {
      const scope = Reflector.resolveProviderScope(<Type<any>>provider);
      const lazyInjects = Registry.getLazyInjects(<Type<any>>provider);

      lazyInjects.forEach(({ lazyInject, forwardRef }) => {
        const token = Registry.getForwardRef(forwardRef);
        lazyInject(this.lazyInject, token);
      });

      this.bindProvider(<Type<any>>provider, scope);
    } else if (type === ProviderTypes.FACTORY) {
      await this.bindFactoryProvider(token, <FactoryProvider<any>>provider);
    } else if (type === ProviderTypes.VALUE) {
      this.bindValueProvider(token, <ValueProvider<any>>provider);
    } else if (type === ProviderTypes.CLASS) {
      this.bindClassProvider(token, <ClassProvider<any>>provider);
    } else if (type === ProviderTypes.EXISTING) {
      this.bindExistingProvider(token, <ExistingProvider<any>>provider);
    }
  }

  public addGlobalProviders() {
    this.providers.bind(Injector).toConstantValue(this.providers);
    this.providers.bind(OneContainer).toConstantValue(this.container);
    this.providers.bind(ONE_MODULE.name).toConstantValue(this);

    this.providers
      .bind(Injector)
      .toConstantValue(this.providers)
      .whenInjectedInto(<any>this.target);

    this.providers
      .bind(OneContainer)
      .toConstantValue(this.container)
      .whenInjectedInto(<any>this.target);
  }
}
