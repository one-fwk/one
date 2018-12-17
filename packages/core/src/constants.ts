export enum Metadata {
  IMPORTS = 'imports',
  EXPORTS = 'exports',
  PROVIDERS = 'providers',
}

export enum Scopes {
  SINGLETON = 'singleton',
  TRANSIENT = 'transient',
  REQUEST = 'request',
}

export enum ProviderTypes {
  FACTORY = 'factory',
  CLASS = 'class',
  EXISTING = 'existing',
  VALUE = 'value',
  DEFAULT = 'default',
}

export const SHARED_MODULE_METADATA = Symbol.for('Metadata<SharedModule>');
export const IS_MODULE_METADATA = Symbol.for('Metadata<Module>');
export const SCOPE_METADATA = Symbol.for('Metadata<Scope>');
export const IS_INJECTABLE_METADATA = Symbol.for('Metadata<Injectable>');
