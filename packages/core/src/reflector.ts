import 'reflect-metadata';

import { Dependency, ModuleImport, Type } from './interfaces';
import { OneModule } from './module';
import {
  SCOPE_METADATA,
  IS_INJECTABLE_METADATA,
  IS_MODULE_METADATA,
  SHARED_MODULE_METADATA,
  Metadata,
} from './constants';

export class Reflector {
  public static defineByKeys<T = object>(
    metadata: any,
    target: T,
    exclude: string[] = [],
  ): T {
    Object.keys(metadata)
      .filter(p => !exclude.includes(p))
      .forEach(property => {
        this.set(property, metadata[property], target);
      });

    return target;
  }

  public static getDesignType(target: object, propertyKey?: string | symbol) {
    return this.get('design:type', target, propertyKey);
  }

  public static get<T = any>(metadataKey: string | symbol, target: any, propertyKey?: string | symbol): T | null {
    return (target instanceof Object && Reflect.getMetadata(metadataKey, target, propertyKey!)) || null;
  }

  public static set(
    metadataKey: string | symbol,
    metadataValue: any,
    target: any,
    propertyKey?: string | symbol,
  ) {
    Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey!);
  }

  public static has(metadataKey: string | symbol, target: any, propertyKey?: string | symbol) {
    return target instanceof Object && Reflect.hasMetadata(metadataKey, target, propertyKey!);
  }

  public static isGlobalModule(target: any) {
    return this.has(SHARED_MODULE_METADATA, target);
  }

  public static isModule(target: any) {
    return this.has(IS_MODULE_METADATA, target);
  }

  public static isInjectable(target: any) {
    return this.has(IS_INJECTABLE_METADATA, target);
  }

  public static getModuleScope(target: Type) {
    const scope = this.get(SHARED_MODULE_METADATA, target);
    return scope ? scope : 'global';
  }

  public static getModuleImports(target: Type): ModuleImport[] {
    return this.get(Metadata.IMPORTS, target) || [];
  }

  public static getProviderScope(provider: Type) {
    return this.get(SCOPE_METADATA, provider);
  }
}
