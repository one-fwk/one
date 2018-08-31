import 'reflect-metadata';

import { Type } from './interfaces';

export class Reflector {
  public static defineMetadataByKeys<T = object>(
    target: T,
    metadata: { [name: string]: any },
    exclude: string[] = [],
  ) {
    Object.keys(metadata)
      .filter(p => !exclude.includes(p))
      .forEach(property => {
        Reflect.defineMetadata(property, metadata[property], target);
      });

    return target;
  }

  public static reflectMetadata(target: Type<any>, metadataKey: string) {
    return Reflect.getMetadata(metadataKey, <any>target) || [];
  }
}
