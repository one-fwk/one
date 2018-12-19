import { Provider } from '../provider.interface';
import { Type } from '../type.interface';

export interface ModuleWithProviders<T> {
  module: Type<T>;
  providers: Provider[];
}
