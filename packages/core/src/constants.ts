export enum Metadata {
  IMPORTS = 'imports',
  EXPORTS = 'exports',
  PROVIDERS = 'providers',
}

export enum Scopes {
  SINGLETON,
  TRANSIENT,
  REQUEST,
}

export enum ProviderTypes {
  FACTORY,
  CLASS,
  EXISTING,
  VALUE,
  DEFAULT,
}

export const SHARED_MODULE_METADATA = Symbol.for('Metadata<SharedModule>');
export const SCOPE_METADATA = Symbol.for('Metadata<Scope>');
export const PROVIDER_METADATA = Symbol.for('Metadata<Provider>');
