import {
  Injectable,
  Inject,
  forwardRef,
  OnAppInit,
  OnModuleInit,
} from '@one/core';

import { DogService } from './dog.service';

@Injectable()
export class CatService implements OnAppInit, OnModuleInit {
  constructor(private readonly dog: DogService) {}

  onAppInit() {
    console.log(this.dog);
  }

  onModuleInit() {
    console.log(this);
  }
}
