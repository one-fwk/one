import { InjectionToken } from './injection-token';
import { ModuleCompiler } from './compiler';
import { Reflector } from '../reflector';
import { Registry } from '../registry';
import { OneModule } from './module';
import { Metadata } from '../constants';
import { isNil, flatten, concat, getEntryValues } from '../util';
import { Injectable } from '../decorators';
import {
  UnknownModuleException,
  InvalidModuleException,
  UnknownProviderException,
  MissingInjectionTokenException,
} from '../errors';
import {
  Dependency,
  ModuleExport,
  ModuleImport,
  ModuleMetadata,
  Provider,
  Token,
  Type,
} from '../interfaces';

export interface StrictSelect {
  strict?: boolean;
}

@Injectable()
export class OneContainer {
  private readonly dynamicModulesMetadata = new Map<string, ModuleMetadata>();
  private readonly moduleCompiler = new ModuleCompiler();

  /**
   * Global modules that should be imported in every scope
   */
  private readonly globalModules = new Set<OneModule>();
  private readonly modules = new Map<string, OneModule>();

  /**
   * Set of modules in the order they're created
   */
  private readonly createdModules = new Set<OneModule>();

  /**
   * Used to detect whether or not a token has already been provided
   * to ensure the "multi" property needs to be set
   */
  private readonly providerTokens = new Set<Token>();

  public isModuleCreated(module: OneModule) {
    return this.createdModules.has(module);
  }

  public addCreatedModule(module: OneModule) {
    this.createdModules.add(module);
  }

  public hasProviderToken(token: Token) {
    return this.providerTokens.has(token);
  }

  public addProviderToken(token: Token) {
    this.providerTokens.add(token);
  }

  private getModulesFrom(module?: Type<OneModule>) {
    return !isNil(module)
      ? [<OneModule>this.getModule(module)]
      : this.getModuleValues();
  }

  public isProviderBound(
    provider: Type | InjectionToken<any>,
    module?: Type<OneModule>,
  ) {
    const token = Registry.getToken(provider);
    return this.getModulesFrom(module).some(({ injector }) =>
      injector.isBound(token),
    );
  }

  public getRootModule() {
    return this.modules.values().next().value;
  }

  public replace(
    toReplace: Dependency,
    options: any & { scope: any[] | null },
  ) {
    [...this.modules.values()].forEach(module => {
      module.replace(toReplace, options);
    });
  }

  public getProvider<T>(
    provider: Token | Provider,
    scope?: Type<OneModule>,
    { strict }: StrictSelect = {},
  ): T {
    const token = Registry.getProviderToken(<any>provider);

    if (strict) {
      const { injector } = this.getModule(scope!)!;

      if (injector.isBound(token)) {
        return injector.get<T>(token);
      } else {
        throw new Error('Container.getProvider()');
      }
    } else {
      for (const { injector } of this.modules.values()) {
        if (injector.isBound(token)) {
          return injector.get<T>(token);
        }
      }
    }

    throw new UnknownProviderException(provider, scope!);
  }

  public getAllProviders<T>(provider: InjectionToken<T>, target?: Type<any>) {
    if (!Registry.isInjectionToken(provider)) {
      throw new MissingInjectionTokenException('Container.getAllProviders()');
    }

    const token = Registry.getToken(provider);

    return flatten<T | Promise<Type<T>>>(
      this.getModulesFrom(target).map(({ injector }) =>
        injector.isBound(token) ? injector.getAll(token) : [],
      ),
    );
  }

  public getModuleValues() {
    return getEntryValues<OneModule>(this.modules.entries());
  }

  public hasModule(module: Type) {
    return this.getModuleValues().some(({ target }) => target === module);
  }

  public getModule(module: Type): OneModule | undefined {
    return this.getModuleValues().find(({ target }) => target === module);
  }

  public getModuleByToken(token: string) {
    if (!this.modules.has(token)) {
      throw new UnknownModuleException([token]);
    }

    return <OneModule>this.modules.get(token);
  }

  public getCreatedModules() {
    return this.createdModules;
  }

  public getModules() {
    return this.modules;
  }

  public async addProvider(provider: Provider, token: string) {
    const module = this.getModuleByToken(token);
    await module.addProvider(provider);
  }

  public addExported(component: ModuleExport, token: string) {
    const module = this.getModuleByToken(token);
    module.addExported(component);
  }

  public addGlobalModule(module: OneModule) {
    this.globalModules.add(module);
  }

  public async addModule(module: ModuleImport, scope: Type<OneModule>[] = []) {
    if (!module) throw new InvalidModuleException(scope);

    const {
      target,
      dynamicMetadata,
      token,
    } = await this.moduleCompiler.compile(module, scope);
    if (this.modules.has(token)) return;

    const oneModule = new OneModule(target, scope, this);
    oneModule.addGlobalProviders();
    this.modules.set(token, oneModule);

    const modules = concat(scope, target);
    await this.addDynamicMetadata(token, dynamicMetadata, modules);

    if (Reflector.isGlobalModule(target)) {
      this.addGlobalModule(oneModule);
    }
  }

  private async addDynamicMetadata(
    token: string,
    dynamicModuleMetadata: ModuleMetadata | undefined,
    scope: Type<OneModule>[],
  ) {
    if (!dynamicModuleMetadata) return;

    this.dynamicModulesMetadata.set(token, dynamicModuleMetadata);
    await this.addDynamicModules(dynamicModuleMetadata.imports, scope);
  }

  private async addDynamicModules(
    modules: ModuleImport[] = [],
    scope: Type<OneModule>[],
  ) {
    for (const module of modules) {
      await this.addModule(module, scope);
    }
  }

  public bindGlobalScope() {
    this.modules.forEach(module => this.bindGlobalsToImports(module));
  }

  private bindGlobalsToImports(module: OneModule) {
    this.globalModules.forEach(globalModule => {
      this.bindGlobalModuleToModule(module, globalModule);
    });
  }

  private bindGlobalModuleToModule(module: OneModule, globalModule: OneModule) {
    if (globalModule === module) return;
    module.addImport(globalModule);
  }

  public async addImport(relatedModule: ModuleImport, token: string) {
    if (!this.modules.has(token)) {
      throw new Error('addImport');
    }

    const module = this.getModuleByToken(token);
    const scope = concat(module.scope, module.target);

    const { token: relatedModuleToken } = await this.moduleCompiler.compile(
      relatedModule,
      scope,
    );

    const related = this.getModuleByToken(relatedModuleToken);
    module.addImport(related);
  }

  public getDynamicMetadataByToken(token: string, key: Metadata) {
    const metadata = this.dynamicModulesMetadata.get(token);
    return metadata && metadata[key] ? metadata[key] : [];
  }
}
