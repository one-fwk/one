import { Injectable, Reflector } from '@one/core';

import { CommandOptions } from '../interfaces';
import { COMMAND_META } from '../tokens';

export function Command(options: CommandOptions): ClassDecorator {
  return (target) => {
    Reflector.set(COMMAND_META, options, target);
    Injectable()(target);
  };
}
