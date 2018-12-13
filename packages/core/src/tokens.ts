import { Container } from 'inversify';

import { InjectionToken } from './module';
import { Type } from './interfaces';
import { Injectable } from './decorators';

export const APP_INIT = new InjectionToken<any>('Initialize<App>');
export const APP_DESTROY = new InjectionToken<any>('Destroy<App>');
export const MODULE_INIT = new InjectionToken<any>('Initialize<Module>');
export const MODULE_REF = new InjectionToken<Type<any>>('Ref<Module>');

@Injectable()
export class Injector extends Container {}
