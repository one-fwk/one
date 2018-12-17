import {
  DynamicModule,
  Type,
  ModuleFactory,
  ModuleImport,
  Omit,
} from '../interfaces';
import { ModuleTokenFactory } from './token-factory';
import { Registry } from '../registry';
import { OneModule } from './module';
import { getDeferred } from '../util';

export class ModuleCompiler {
  private readonly moduleTokenFactory = new ModuleTokenFactory();

  public async compile(
    module: ModuleImport,
    scope: Type<OneModule>[] = [],
  ): Promise<ModuleFactory> {
    const { target, dynamicMetadata } = await this.extractMetadata(module);

    const token = this.moduleTokenFactory.create(
      target,
      scope,
      dynamicMetadata,
    );

    return { target, dynamicMetadata, token };
  }

  private async extractMetadata(
    module: ModuleImport,
  ): Promise<Omit<ModuleFactory, 'token'>> {
    const moduleRef = await getDeferred(module);

    if (!Registry.isDynamicModule(moduleRef)) {
      return { target: <Type>module };
    }

    const { module: target, ...dynamicMetadata } = <DynamicModule>moduleRef;
    return { target, dynamicMetadata };
  }
}
