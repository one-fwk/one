import { Scanner, OneContainer, OneModule, InjectionToken } from './module';
import { ExceptionsZone, MissingInjectionTokenException } from './errors';
import { Registry } from './registry';
import { FactoryOptions, Type } from './interfaces';

// @TODO: Figure out why <https://github.com/inversify/InversifyJS/blob/master/wiki/hierarchical_di.md> doesn't work
export class OneFactory {
  protected readonly container = new OneContainer();
  protected readonly scanner = new Scanner(this.container, this.options);

  constructor(
    private readonly module: Type,
    private readonly options: FactoryOptions = {},
  ) {}

  public async start() {
    await ExceptionsZone.run(async () => {
      await this.scanner.scan(this.module);

      if (!this.options.testing) {
        await this.init();
      }
    });
  }

  public async destroy() {
    await ExceptionsZone.run(async () => {
      const modules = this.container.getCreatedModules();

      for (const module of modules) {
        await module.onAppDestroy();
      }
    });
  }

  private async init() {
    const modules = this.container.getCreatedModules();

    for (const module of modules) {
      await module.onAppInit();
    }
  }

  public select(module: Type<OneModule>) {
    return {
      get: <T>(provider: Type<T> | InjectionToken<T>) => {
        return this.container.getProvider<T>(provider, module, {
          strict: true,
        });
      },
      getAll: <T>(token: InjectionToken<T>) => {
        if (!Registry.isInjectionToken(token)) {
          throw new MissingInjectionTokenException(
            'OneFactory.select().getAll()',
          );
        }

        return this.container.getAllProviders<T>(token, module);
      },
      has: (provider: Type | InjectionToken<any>) => {
        return this.container.isProviderBound(provider, module);
      },
    };
  }

  public has(provider: Type | InjectionToken<any>) {
    return this.container.isProviderBound(provider);
  }

  public getAll<T>(token: InjectionToken<T>) {
    if (!Registry.isInjectionToken(token)) {
      throw new MissingInjectionTokenException('OneFactory.getAll()');
    }

    return this.container.getAllProviders<T>(token);
  }

  public get<T>(provider: Type<T> | InjectionToken<T>) {
    return this.container.getProvider<T>(provider);
  }
}
