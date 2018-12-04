import * as hash from 'object-hash';
import stringify from 'fast-safe-stringify';

import { Type, DynamicModule } from '../interfaces';
import { Reflector } from '../reflector';

export class ModuleTokenFactory {
  public create(
    target: Type<any>,
    scope: Type<any>[],
    dynamicModuleMetadata?: Partial<DynamicModule>,
  ): string {
    const reflectedScope = Reflector.getModuleScope(target);
    const isSingleScoped = reflectedScope === true;

    const opaqueToken = {
      module: target.name,
      dynamic: this.getDynamicMetadataToken(dynamicModuleMetadata!),
      scope: isSingleScoped ? this.getScopeStack(scope) : reflectedScope,
    };

    return hash(opaqueToken);
  }

  private getDynamicMetadataToken(
    dynamicModuleMetadata: Partial<DynamicModule>,
  ) {
    // Uses safeStringify instead of JSON.stringify
    // to support circular dynamic modules
    return dynamicModuleMetadata ? stringify(dynamicModuleMetadata) : '';
  }

  public getScopeStack(scope: Type<any>[]): string[] {
    const reversedScope = scope.reverse();
    const firstGlobalIndex = reversedScope.findIndex(
      s => Reflector.getModuleScope(s) === 'global',
    );
    scope.reverse();

    const stack =
      firstGlobalIndex >= 0
        ? scope.slice(scope.length - firstGlobalIndex - 1)
        : scope;
    return stack.map(module => module.name);
  }
}
