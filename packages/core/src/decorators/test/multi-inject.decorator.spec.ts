import 'reflect-metadata';
import { Test } from '@one/testing';
import { Injectable, InjectionToken, MultiInject } from '@one/core';
import {
  MissingInjectionTokenException,
  MissingInjectionTokenMessage,
} from '../../errors';

describe('@MultiInject()', () => {
  it('should multi inject providers', async () => {
    interface Weapon {
      power: number;
    }

    const WEAPON = new InjectionToken<Weapon>('WEAPON');

    @Injectable()
    class Katana implements Weapon {
      power = 10;
    }

    @Injectable()
    class Shuriken implements Weapon {
      power = 0.3;
    }

    @Injectable()
    class Ninja {
      readonly katana: Katana;
      readonly shuriken: Shuriken;

      constructor(@MultiInject(WEAPON) weapons: Weapon[]) {
        this.katana = weapons[0];
        this.shuriken = weapons[1];
      }
    }

    const test = await Test.createTestingModule({
      providers: [
        {
          provide: WEAPON,
          useClass: Katana,
          multi: true,
        },
        {
          provide: WEAPON,
          useClass: Shuriken,
          multi: true,
        },
        Ninja,
      ],
    }).compile();

    const weapons = test.getAll<Weapon>(WEAPON);
    const ninja = test.get<Ninja>(Ninja);

    expect(weapons).toHaveLength(2);

    expect(weapons[0]).toBeInstanceOf(Katana);
    expect(weapons[1]).toBeInstanceOf(Shuriken);

    expect(ninja.katana).toBeInstanceOf(Katana);
    expect(ninja.shuriken).toBeInstanceOf(Shuriken);
  });

  it('should throw error when not using an <InjectionToken>', () => {
    const error = new MissingInjectionTokenException('@MultiInject()');

    expect(() => {
      class Ninja {}

      class Test {
        constructor(@MultiInject(<any>Ninja) weapons: any[]) {}
      }
    }).toThrow(error);
  });
});
