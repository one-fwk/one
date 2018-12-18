import getDecorators from 'inversify-inject-decorators';

import { ProviderTypes, Scopes } from '../constants';
import { OneContainer } from './container';
import { Reflector } from '../reflector';
import { Registry } from '../registry';
import { createDeferredPromise, runSeries } from '../util';
import { InjectionToken } from './injection-token';
import {
  InvalidExportException,
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
  Provider,
  Token,
  Type,
  ValueProvider,
} from '../interfaces';
import {
  APP_DESTROY,
  APP_INIT,
  Injector,
  MODULE_INIT,
  MODULE_REF,
} from '../tokens';

export class OneModule {
  public readonly imports = new Set<OneModule>();
  public readonly providers = new Set<Provider>();
  public readonly injector = new Injector({ skipBaseClassChecks: true });
  public readonly lazyInject = getDecorators(this.injector).lazyInject;
  public readonly exports = new Set<Token>();
  public readonly created = createDeferredPromise();
  private readonly factoryValues = new Map<Token, any>();

  constructor(
    public readonly target: Type,
    public readonly scope: Type[],
    public readonly container: OneContainer,
  ) {}

  public addImport(relatedModule: OneModule) {
    this.imports.add(relatedModule);
  }

  public addProvider(provider: Provider) {
    this.providers.add(provider);
  }

  private providerContainerHasToken(token: Token) {
    return [...this.providers.values()].some(provider => {
      return Registry.getProviderToken(provider) === token;
    });
  }

  private validateExported(token: Token, exported: ModuleExport) {
    if (this.providerContainerHasToken(token)) return token;

    const imported = [...this.imports.values()];
    const importedRefNames = <any[]>imported
      .filter(item => item)
      .map(({ target }) => target)
      .filter(target => target);

    if (!importedRefNames.includes(token)) {
      throw new UnknownExportException(this.target.name, (<Type>exported).name);
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
      Injector,
      OneContainer,
      MODULE_REF,
      ...this.providers.values(),
      ...this.getRelatedProviders().values(),
    ];
  }

  private linkRelatedProviders() {
    const providers = this.getRelatedProviders();

    providers.forEach(token => {
      const provider = this.container.getProvider(token, this.target);

      this.injector.bind(token).toConstantValue(provider);
    });
  }

  private getRelatedProviders() {
    const providerScope = new Set<Token>();

    const find = (type: OneModule | Token | unknown, scope: Type[]) => {
      if (Registry.isToken(type)) {
        providerScope.add(<Token>type);
      } else if (type instanceof OneModule) {
        for (const related of (<OneModule>type).exports) {
          const ref = this.container.hasModule(<Type<OneModule>>related)
            ? this.container.getModule(<Type<OneModule>>related)
            : related;

          find(ref!, [...scope, type.target]);
        }
      } else {
        throw new InvalidExportException(type, scope);
      }
    };

    for (const related of this.imports) {
      find(related, [this.target]);
    }

    return providerScope;
  }

  private async bindProviders() {
    this.linkRelatedProviders();

    for (const provider of this.providers) {
      const token = Registry.getProviderToken(provider);

      const isMulti = (<MultiDepsProvider>provider).multi;
      if (!isMulti && this.container.hasProviderToken(token)) {
        const name = Registry.getProviderName(provider);
        throw new MultiProviderException(name);
      }

      this.container.addProviderToken(token);
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

  private getModule() {
    return this.injector.get<any>(this.target);
  }

  private runOnAppDestroy(instance: any) {
    return instance.onAppDestroy && instance.onAppDestroy();
  }

  private runOnAppInit(instance: any) {
    return instance.onAppInit && instance.onAppInit();
  }

  private runOnModuleDestroy(instance: any) {
    return instance.onModuleDestroy && instance.onModuleDestroy();
  }

  private runOnModuleInit(instance: any) {
    return instance.onModuleInit && instance.onModuleInit();
  }

  private async everyInjectable(
    every: (provider: Type<any>) => Promise<void> | void,
  ) {
    for (const provider of this.providers) {
      if (!Reflector.isInjectable(provider)) continue;

      await every(this.injector.get(<Type<any>>provider));
    }
  }

  public async onModuleInit() {
    const module = this.getModule();

    await this.runOnModuleInit(module);
    await this.factoriesOnModuleInit();
    await this.injectablesOnModuleInit();
  }

  public async onAppInit() {
    const module = this.getModule();

    await this.runOnAppInit(module);
    await this.factoriesOnAppInit();
    await this.injectablesOnAppInit();
  }

  public async onAppDestroy() {
    const module = this.getModule();

    await this.runOnAppDestroy(module);
    await this.factoriesOnAppDestroy();
    await this.injectablesOnAppDestroy();
  }

  private async injectablesOnAppDestroy() {
    await this.everyInjectable(provider => this.runOnAppDestroy(provider));
  }

  private async injectablesOnAppInit() {
    await this.everyInjectable(provider => this.runOnAppInit(provider));
  }

  private async factoriesOnAppDestroy() {
    await this.runProviderSeries(APP_DESTROY);
  }

  private async factoriesOnAppInit() {
    await this.runProviderSeries(APP_INIT);
  }

  private async injectablesOnModuleInit() {
    await this.everyInjectable(provider => this.runOnModuleInit(provider));
  }

  private async factoriesOnModuleInit() {
    await this.runProviderSeries(MODULE_INIT);
  }

  private async runProviderSeries(token: InjectionToken<any>) {
    await runSeries(this.container.getAllProviders(token, this.target));
  }

  public async create() {
    if (this.injector.isBound(this.target)) return;

    await this.bindProviders();

    this.injector.bind(this.target).toSelf();
    await this.onModuleInit();

    this.created.resolve();
  }

  private getProviderType(provider: Provider) {
    const module = this.target.name;

    if (Reflector.isInjectable(provider)) {
      return ProviderTypes.DEFAULT;
    } else if (Registry.isFactoryProvider(provider, module)) {
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
      dependencies.map(ref => {
        const dependency = Registry.getForwardRef(ref);
        Registry.assertProvider(dependency);

        const provider = this.getProvider(dependency);
        return this.container.getProvider(provider, this.target);
      }),
    );
  }

  private async bindFactoryProvider(
    token: Token,
    provider: FactoryProvider<any>,
  ) {
    const deps = await this.getDependencies(provider.deps);

    return this.injector.bind(token).toFactory(() => {
      if (
        !this.factoryValues.has(token) ||
        provider.scope === Scopes.TRANSIENT
      ) {
        this.factoryValues.set(token, provider.useFactory(...deps));
      }

      return this.factoryValues.get(token);
    });
  }

  private bindProvider(provider: Type, scope?: Scopes) {
    const binding = this.injector.bind(provider).toSelf();

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
    return this.injector.bind(token).to(provider.useClass);
  }

  private bindValueProvider(token: Token, provider: ValueProvider<any>) {
    return this.injector.bind(token).toConstantValue(provider.useValue);
  }

  private bindExistingProvider(token: Token, provider: ExistingProvider<any>) {
    const existingToken = Registry.getToken(provider.useExisting);
    const existing = this.injector.get(existingToken);
    return this.injector.bind(token).toConstantValue(existing);
  }

  public async bind(token: Token, type: ProviderTypes, provider: Provider) {
    if (type === ProviderTypes.DEFAULT) {
      const scope = Reflector.getProviderScope(<Type>provider);
      const lazyInjects = Registry.getLazyInjects(<Type>provider);

      lazyInjects.forEach(({ lazyInject, forwardRef }) => {
        const token = Registry.getForwardRef(forwardRef);
        lazyInject(this.lazyInject, token);
      });

      this.bindProvider(<Type>provider, scope);
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
    this.injector.bind(Injector).toConstantValue(this.injector);
    this.injector.bind(OneContainer).toConstantValue(this.container);
    this.injector.bind(MODULE_REF.name).toConstantValue(this);

    /*this.injector
      .bind(Injector)
      .toConstantValue(this.injector)
      .whenInjectedInto(<any>this.target);

    this.injector
      .bind(OneContainer)
      .toConstantValue(this.container)
      .whenInjectedInto(<any>this.target);*/
  }
}
