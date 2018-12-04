import { Scopes, SCOPE_METADATA } from '../../constants';
import { Reflector } from '../../reflector';

export function TransientScope(): ClassDecorator {
  return target => {
    Reflector.set(SCOPE_METADATA, Scopes.TRANSIENT, target);
  };
}
