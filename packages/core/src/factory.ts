import { Scanner, OneContainer, OneModule, InjectionToken } from './module';
import { ExceptionsZone, MissingInjectionTokenException } from './errors';
import { Registry } from './registry';
import { series } from './util';
import { APP_INIT, APP_DESTROY } from './tokens';
import { FactoryOptions, Type } from './interfaces';

// @TODO: Figure out why <https://github.com/inversify/InversifyJS/blob/master/wiki/hierarchical_di.md> doesn't work
export class OneFactory {
  public readonly container = new OneContainer();
  public readonly scanner = new Scanner(this.container);

  constructor(
    private readonly module: Type<any>,
    private readonly options: FactoryOptions = {},
  ) {}

  public async start() {
    await ExceptionsZone.run(async () => {
      await this.scanner.scan(this.module);
      await this.init();
    });
  }

  public async destroy() {
    await ExceptionsZone.run(async () => {
      await series(this.container.getAllProviders(APP_DESTROY));
    });
  }

  private async init() {
    await series(this.container.getAllProviders(APP_INIT));
  }

  public select(module: Type<OneModule>) {
    return {
      get: <T>(provider: Type<any> | InjectionToken<T>) => {
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
      has: (provider: Type<any> | InjectionToken<any>) => {
        return this.container.isProviderBound(provider, module);
      },
    };
  }

  public has(provider: Type<any> | InjectionToken<any>) {
    return this.container.isProviderBound(provider);
  }

  public getAll<T>(token: InjectionToken<T>) {
    if (!Registry.isInjectionToken(token)) {
      throw new MissingInjectionTokenException('OneFactory.getAll()');
    }

    return this.container.getAllProviders<T>(token);
  }

  public get<T>(provider: Type<any> | InjectionToken<T>) {
    return this.container.getProvider<T>(provider);
  }
}
