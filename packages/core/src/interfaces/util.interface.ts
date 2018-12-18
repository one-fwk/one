export interface DeferredPromise<T> extends Promise<T> {
  resolve: () => void;
  reject: () => void;
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type RequiredKnownKeys<T> = {
  [K in keyof T]: {} extends Pick<T, K> ? never : K
} extends { [_ in keyof T]: infer U }
  ? ({} extends U ? never : U)
  : never;

export type OptionalKnownKeys<T> = {
  [K in keyof T]: string extends K
    ? never
    : number extends K
    ? never
    : {} extends Pick<T, K>
    ? K
    : never
} extends { [_ in keyof T]: infer U }
  ? ({} extends U ? never : U)
  : never;
