import { ForwardRef, TForwardRef } from './interfaces';

export const forwardRef = (fn: TForwardRef): ForwardRef => ({
  forwardRef: fn,
});
