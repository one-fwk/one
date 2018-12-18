import hash from 'object-hash';
import stringify from 'fast-safe-stringify';

import { Type, ModuleMetadata } from '../interfaces';
import { Reflector } from '../reflector';

export class ModuleTokenFactory {
  public create(
    target: Type,
    scope: Type[],
    dynamicModuleMetadata?: ModuleMetadata,
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
    dynamicModuleMetadata: ModuleMetadata,
  ): string {
    // Uses safeStringify instead of JSON.stringify
    // to support circular dynamic modules
    return dynamicModuleMetadata ? stringify(dynamicModuleMetadata) : '';
  }

  private getScopeStack(scope: Type[]): string[] {
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
