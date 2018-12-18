import { Injectable, Reflector } from '@one/core';

import { CommandOptions } from '../interfaces';
import { COMMAND } from '../tokens';

export function Command(options: CommandOptions): ClassDecorator {
  return target => {
    Injectable()(target);
    Reflector.set(COMMAND, options, target);
  };
}
