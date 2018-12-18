import { SHARED_MODULE_METADATA } from '../../constants';
import { Reflector } from '../../reflector';

/** @deprecated */
export function Global(): ClassDecorator {
  return target => {
    Reflector.set(SHARED_MODULE_METADATA, true, target);
  };
}
