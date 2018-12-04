import { Scopes, SCOPE_METADATA } from '../../constants';
import { Reflector } from '../../reflector';

export function RequestScope(): ClassDecorator {
  return target => {
    Reflector.set(SCOPE_METADATA, Scopes.REQUEST, target);
  };
}
