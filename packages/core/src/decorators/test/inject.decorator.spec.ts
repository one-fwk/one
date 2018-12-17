import 'reflect-metadata';
import { Test } from '@one/testing';
import { forwardRef, Inject, Injectable, InjectionToken } from '@one/core';
import { Registry } from '../../registry';
import { CircularDependencyException } from '../../errors';

// @TODO: Figure out a way to implement parameter injection
describe('@Inject()', () => {
  /*it('should inject dependencies using parameter references', async () => {
    const TEST_TOKEN = new InjectionToken<any>('TEST_TOKEN');

    @Injectable()
    class Test1 {
      constructor(
        @Inject(TEST_TOKEN)
        public readonly test: any,
      ) {}
    }

    const module = await Test.createTestingModule({
      providers: [
        {
          provide: TEST_TOKEN,
          useValue: '',
        },
        Test1,
      ],
    }).compile();

    expect(module.get<Test1>(Test1).test).toEqual('');
  });*/

  it('should inject dependencies using property references', () => {});

  it('should create circular dependencies', () => {
    const error = new CircularDependencyException('Test1');

    expect(() => {
      @Injectable()
      class Test1 {
        // @ts-ignore
        @Inject(Test2)
        public readonly test2!: Test2;
      }

      @Injectable()
      class Test2 {
        // @ts-ignore
        @Inject(Test1)
        public readonly test1!: Test1;
      }
    }).toThrow(error);
  });

  it('should solve circular dependencies using forwardRef', async () => {
    const addSpy = jest.spyOn(Registry.lazyInjects, 'add');

    @Injectable()
    class Test1 {
      //constructor(
      @Inject(forwardRef(() => Test2))
      public readonly test2: Test2;
      //) {}
    }

    @Injectable()
    class Test2 {
      //constructor(
      @Inject(forwardRef(() => Test1))
      public readonly test1: Test1;
      //) {}
    }

    const test = await Test.createTestingModule({
      providers: [Test1, Test2],
    }).compile();

    expect(addSpy).toHaveBeenCalledTimes(2);
    expect(test.get<Test1>(Test1).test2).toBeInstanceOf(Test2);
    expect(test.get<Test2>(Test2).test1).toBeInstanceOf(Test1);
  });
});
