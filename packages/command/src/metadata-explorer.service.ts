import { Injectable, isFunc, Reflector } from '@one/core';
import { POSITIONAL_META, OPTION_META } from './tokens';

@Injectable()
export class MetadataExplorerService {
  public *scanForPositionals(instance: Object): IterableIterator<string> {
    for (const propertyKey in instance) {
      if (isFunc((instance as any)[propertyKey])) continue;

      if (Reflector.has(POSITIONAL_META, instance, propertyKey)) {
        yield propertyKey;
      }
    }
  }

  public *scanForOptions(instance: Object): IterableIterator<string> {
    for (const propertyKey in instance) {
      if (isFunc((instance as any)[propertyKey])) continue;

      if (Reflector.has(OPTION_META, instance, propertyKey)) {
        yield propertyKey;
      }
    }
  }
}