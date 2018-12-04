import { Type } from './type.interface';
// import { InjectionToken } from '../module';

export type TForwardRef = () => Type<any>;

export interface ForwardRef {
  forwardRef: TForwardRef;
}
