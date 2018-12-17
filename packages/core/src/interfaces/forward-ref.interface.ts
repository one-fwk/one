import { Type } from './type.interface';

export type TForwardRef = () => Type;

export interface ForwardRef {
  forwardRef: TForwardRef;
}
