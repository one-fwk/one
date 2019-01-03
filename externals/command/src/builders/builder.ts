import { ArgvType } from '../interfaces';

export enum BuilderType {
  POSITIONAL = 'positional',
  OPTION = 'option',
}

export class Builder<T extends ArgvType> {
  constructor(
    public readonly type: BuilderType,
    public readonly propertyKey: string,
    public metadata: T,
  ) {}
}