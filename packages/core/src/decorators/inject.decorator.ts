import { inject, LazyServiceIdentifer } from 'inversify';

import {
  ForwardRef,
  Token,
  Dependency,
  TLazyInject,
  Type,
} from '../interfaces';
import { Registry } from '../registry';

export function createLazyInjection(
  target: object,
  propertyKey: string,
  index?: number,
) {
  return (lazyInject: TLazyInject, provider: Token) => {
    Registry.assertProvider(provider);

    lazyInject(provider)(target, propertyKey);
  };
}

export function Inject(provider: Dependency) {
  return (target: object, propertyKey: string, index?: number) => {
    if (!Registry.hasForwardRef(provider)) {
      Registry.assertProvider(provider, target.constructor.name);

      const token = Registry.getProviderToken(provider);
      return inject(token)(target, propertyKey, index);
    }

    // Hacky workaround would be to store a symbol for the class as id
    /*const lazyService = new LazyServiceIdentifer(() => {
      const { forwardRef } = <ForwardRef>provider;
      Registry.assertProvider(forwardRef(), target.constructor.name);

      // console.log(Registry.getOpaqueToken(provider));
      console.log(forwardRef());
      return Registry.getOpaqueToken(forwardRef());
    });

    // return inject(lazyService)(target, propertyKey, index);*/

    Registry.lazyInjects.add({
      target: target.constructor,
      forwardRef: <ForwardRef>provider,
      lazyInject: createLazyInjection(target, propertyKey, index),
    });
  };
}
