import { Injectable, isFunc, Reflector } from '@one/core';
import { Observable } from 'rxjs';

import { POSITIONAL_META, OPTION_META } from './tokens';

@Injectable()
export class MetadataExplorerService {
  private scanForPropertyMeta(instance: Object, metadataKey: symbol) {
    return new Observable<string>(observer => {
      for (const propertyKey in instance) {
        if (isFunc((instance as any)[propertyKey])) continue;

        if (Reflector.has(metadataKey, instance, propertyKey)) {
          observer.next(propertyKey);
        }
      }

      observer.complete();
    });
  }

  public scanForPositionals(instance: Object): Observable<string> {
    return this.scanForPropertyMeta(instance, POSITIONAL_META);
  }

  public scanForOptions(instance: Object): Observable<string> {
    return this.scanForPropertyMeta(instance, OPTION_META);
  }
}