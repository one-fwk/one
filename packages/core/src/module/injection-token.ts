export class InjectionToken<T> {
  public readonly context = `InjectionToken<${this.desc}>`;
  public readonly name = Symbol.for(this.context);

  constructor(private readonly desc: string) {}
}
