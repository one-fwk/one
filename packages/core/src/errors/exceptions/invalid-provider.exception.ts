import { RuntimeException } from './runtime.exception';
import { Registry } from '../../registry';
import { InvalidProviderMessage } from '../messages';

export class InvalidProviderException extends RuntimeException {
  constructor(provider: any) {
    const name = Registry.getProviderName(provider);

    super(InvalidProviderMessage(name));
  }
}
