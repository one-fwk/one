import { RuntimeException } from './runtime.exception';
import { Type } from '../../interfaces';
import { InvalidExportMessage } from '../messages';

export class InvalidExportException extends RuntimeException {
  constructor(type: any, context: Type<any>[]) {
    const scope = context.map(module => module.name).join(' -> ');

    super(InvalidExportMessage(type.toString(), scope));
  }
}
