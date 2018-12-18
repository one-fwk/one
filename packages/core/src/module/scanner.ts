import { CircularDependencyException } from '../errors';
import { OneContainer } from './container';
import { Reflector } from '../reflector';
import { Metadata } from '../constants';
import { Registry } from '../registry';
import { OneModule } from './module';
import { concat, omit } from '../util';
import { ModuleExport, ModuleImport, Provider, Type } from '../interfaces';

export class Scanner {
  constructor(private readonly container: OneContainer) {}

  public async scan(module: Type<OneModule>) {
    await this.scanForModules(module);
    await this.scanModulesForDependencies();
    this.container.bindGlobalScope();
    await this.createModules();
  }

  /**
   * @TODO: Fix circular imports with forwardRef
   */
  private async createModules() {
    const createModule = async (module: OneModule) => {
      if (!this.container.isModuleCreated(module)) {
        const imports = [...module.imports.values()];

        // Gets all imports where current module is referenced
        // const circularRefs = imports.filter(({ imports }) => imports.has(module));
        // const importsWithoutRefs = omit<OneModule>(imports, circularRefs);

        // Create all circular referenced modules afterwards
        for (const innerModule of imports) {
          await createModule(innerModule);
        }

        await Promise.all([...imports].map(({ created }) => created));
        await module.create();
        this.container.addCreatedModule(module);

        // Create all circular referenced modules afterwards
        /*for (const innerModule of circularRefs) {
          await createModule(innerModule);
        }*/
      }
    };

    const rootModule = this.container.getRootModule();
    await createModule(rootModule);
  }

  /**
   * Scan recursively for imports in a module
   *
   * @param module
   * @param scope
   * @param ctxRegistry
   */
  private async scanForModules(
    module: Type<OneModule>,
    scope: Type<OneModule>[] = [],
    ctxRegistry = new Set<ModuleImport>(),
  ) {
    module = Registry.getForwardRef(module);

    if (!ctxRegistry.has(module)) {
      ctxRegistry.add(module);

      await this.container.addModule(module, scope);

      const modules = !Registry.isDynamicModule(module)
        ? Reflector.getModuleImports(module)
        : [
            ...Reflector.getModuleImports(module.module),
            ...(module.imports || []),
          ];

      for (const innerModule of modules) {
        /*if (ctxRegistry.has(
          Registry.getForwardRef(innerModule)
        )) continue;*/

        const scopedModules = concat(scope, module);
        await this.scanForModules(innerModule, scopedModules, ctxRegistry);
      }
    }
  }

  public async storeImport(
    related: ModuleImport,
    token: string,
    context: string,
  ) {
    if (!related) throw new CircularDependencyException(context);

    await this.container.addImport(Registry.getForwardRef(related), token);
  }

  public async scanModulesForDependencies() {
    const modules = this.container.getModules();

    for (const [token, { target }] of modules) {
      await this.reflectImports(target, token, target.name);
      await this.reflectProviders(target, token);
      this.reflectExports(target, token);
    }
  }

  private async reflectProviders(module: Type<OneModule>, token: string) {
    const providers = this.getDynamicMetadata<Provider>(
      module,
      token,
      Metadata.PROVIDERS,
    );

    for (const provider of providers) {
      await this.container.addProvider(provider, token);
    }
  }

  private getDynamicMetadata<T>(
    module: Type<OneModule>,
    token: string,
    metadataKey: Metadata,
  ): T[] {
    return [
      ...(Reflector.get(metadataKey, module) || []),
      ...this.container.getDynamicMetadataByToken(token, metadataKey),
    ];
  }

  private reflectExports(module: Type<OneModule>, token: string) {
    const exported = this.getDynamicMetadata<ModuleExport>(
      module,
      token,
      Metadata.EXPORTS,
    );

    exported.forEach(exported => {
      this.container.addExported(exported, token);
    });
  }

  private async reflectImports(
    module: Type<OneModule>,
    token: string,
    context: string,
  ) {
    const modules = this.getDynamicMetadata<ModuleImport>(
      module,
      token,
      Metadata.IMPORTS,
    );

    for (const related of modules) {
      await this.storeImport(related, token, context);
    }
  }
}
