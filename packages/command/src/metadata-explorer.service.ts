import { Injectable, isFunc, Reflector } from '@one/core';

import { POSITIONAL_META, OPTION_META } from './tokens';

@Injectable()
export class MetadataExplorerService {
  private scanForPropertyMeta(prototype: object, metadataKey: symbol): string[] {
    return Reflect.ownKeys(prototype).filter(propertyKey =>
      !isFunc((prototype as any)[propertyKey]) &&
        Reflector.has(metadataKey, prototype, propertyKey as string),
    ) as string[];
  }

  public scanForPositionals(prototype: object): string[] {
    return this.scanForPropertyMeta(prototype, POSITIONAL_META);
  }

  public scanForOptions(prototype: object): string[] {
    return this.scanForPropertyMeta(prototype, OPTION_META);
  }
}