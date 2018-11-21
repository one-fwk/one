import { Scopes, SCOPE_METADATA } from '../../constants';

export function RequestScope(): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(SCOPE_METADATA, Scopes.REQUEST, target);
  };
}
