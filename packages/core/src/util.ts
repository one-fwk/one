import { Observable } from 'rxjs';
import { DeferredPromise } from './interfaces';

export const noop = () => {};

export const isEmpty = (array: any[]) => !(array && array.length > 0);

export function isPromise(val: any): val is Promise<any> {
  return val instanceof Promise || (val && isFunc(val.then));
}

export function isObservable(val: any): val is Observable<any> {
  return val instanceof Observable || (val && isFunc(val.subscribe));
}

export function isSymbol(val: any): val is symbol {
  return typeof val === 'symbol';
}

export function isNum(val: any): val is number {
  return typeof val === 'number';
}

export function isObj(val: any): val is Object {
  return typeof val === 'object';
}

export function isNil(val: any): val is undefined | null {
  return isUndef(val) || val === null;
}

export function isString(val: any): val is string {
  return typeof val === 'string';
}

export function isBool(val: any): val is boolean {
  return typeof val === 'boolean';
}

export function isIterable(val: any): val is Iterable<any> {
  return val && isFunc(val[Symbol.iterator]);
}

export function isFunc(val: any): val is Function {
  return typeof val === 'function';
}

export function isUndef(val: any): val is undefined {
  return typeof val === 'undefined';
}

export async function runSeries<T>(promises: Promise<T>[]) {
  for (const promise of promises) {
    await promise;
  }
}

export function concat(...props: any[]): any[] {
  return [].concat(...props);
}

export function createDeferredPromise<T>(): DeferredPromise<T> {
  let resolve!: () => void;
  let reject!: () => void;

  const deferred: any = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  deferred.resolve = resolve;
  deferred.reject = reject;

  return deferred;
}

export async function transformResult<T>(
  resultOrDeferred: T | Promise<T> | Observable<T>,
): Promise<T> {
  if (isObservable(resultOrDeferred)) {
    return await (<Observable<T>>resultOrDeferred).toPromise();
  }

  return await resultOrDeferred;
}

export function getEntryValues<T, S = string>(
  entries: IterableIterator<[S, T]> | Array<[S, T]>,
): T[] {
  return (<Array<[S, T]>>[...entries]).map<T>(([_, value]) => value);
}

export function promisify<F extends Function>(fn: F) {
  return <T>(...args: any[]): Promise<T> => {
    if (!isFunc(fn))
      throw new Error(`Can't promisify a non function: ${JSON.stringify(fn)}`);

    return new Promise((resolve, reject) => {
      fn(...args, (err: Error, ...rest: any[]) => {
        if (err) return reject(err);
        resolve(...rest);
      });
    });
  };
}

export function flatten<T>(arr: any[]): T[] {
  return arr.reduce(
    (previous, current) => [...previous, ...current],
    [] as any[],
  );
}

export function pick<T>(from: any[], by: any[]): T[] {
  return from.filter(f => by.includes(f));
}

export function omit<T>(from: any[], by: any[]): T[] {
  return from.filter(f => !by.includes(f));
}

export function isNode() {
  return (
    isObj(process) && isObj(process.release) && process.release.name === 'node'
  );
}

export async function getDeferred<T>(value: any): Promise<T> {
  return isPromise(value) ? await value : value;
}
