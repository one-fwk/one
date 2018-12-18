import { injectable } from 'inversify';

import { Reflector } from '../reflector';
import { IS_INJECTABLE_METADATA } from '../constants';

export function Injectable(): ClassDecorator {
  return target => {
    Reflector.set(IS_INJECTABLE_METADATA, true, target);

    injectable()(target);
  };
}
