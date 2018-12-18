import { injectable } from 'inversify';
import { ModuleMetadata } from '../../interfaces';
import { Reflector } from '../../reflector';
import { IS_MODULE_METADATA } from '../../constants';

export function Module(metadata: ModuleMetadata = {}): ClassDecorator {
  return target => {
    Reflector.defineByKeys(metadata, target);
    Reflector.set(IS_MODULE_METADATA, true, target);

    injectable()(<any>target);
  };
}
