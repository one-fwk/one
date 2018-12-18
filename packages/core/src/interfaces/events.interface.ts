export interface OnModuleInit {
  onModuleInit(): Promise<void> | void;
}

export interface OnModuleDestroy {
  onModuleDestroy(): Promise<void> | void;
}

export interface OnAppInit {
  onAppInit(): Promise<void> | void;
}

export interface OnAppDestroy {
  onAppDestroy(): Promise<void> | void;
}

export type OnInstance = Partial<
  OnModuleInit | OnModuleDestroy | OnAppInit | OnAppDestroy
>;
