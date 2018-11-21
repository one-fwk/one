import { injectable } from 'inversify';
import { ModuleMetadata } from '../../interfaces';
import { Reflector } from '../../reflector';

export function Module(metadata: ModuleMetadata = {}): ClassDecorator {
  return (target: object) => {
    Reflector.defineByKeys(metadata, target);

    console.log(module.parent);
    console.log(module.children);

    injectable()(<any>target);
  };
}
