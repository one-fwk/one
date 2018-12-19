import { CommandBuilder } from '../builders';

export abstract class Builder<T> {
  constructor(
    protected readonly instance: Object,
    protected readonly propertyKey: string,
    protected readonly options: T,
    protected readonly builder: CommandBuilder,
  ) {
    this.add();
  }

  protected abstract add(): void;
}