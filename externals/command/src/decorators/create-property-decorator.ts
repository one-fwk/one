import { Reflector } from '@one/core';

import { ArgvType } from '../interfaces';

export function createPropertyDecorator<T extends ArgvType>(meta: symbol) {
  return (options?: T): PropertyDecorator => {
    return (target, propertyKey) => {
      // Otherwise we can't iterate over the property if its value is unknown
      Reflect.set(target, propertyKey, null);
      Reflector.set(meta, options || {}, target, propertyKey);
    };
  };
}