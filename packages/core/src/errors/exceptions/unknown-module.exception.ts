import { RuntimeException } from './runtime.exception';
import { UnknownModuleMessage } from '../messages';

export class UnknownModuleException extends RuntimeException {
  constructor(trace: any[] = []) {
    const scope = trace.map(module => module.name).join(' -> ');

    super(UnknownModuleMessage(scope));
  }
}
