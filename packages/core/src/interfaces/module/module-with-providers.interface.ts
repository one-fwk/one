import { Provider } from '../provider.interface';
import { Type } from '../type.interface';

export interface ModuleWithProviders<T = any> {
  module: Type<T>;
  providers: Provider[];
}
