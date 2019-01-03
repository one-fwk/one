import { Command, Positional } from '../decorators';
import { Reflector } from '@one/core';

describe('Test stuff', () => {
  it('should test stuff', () => {
    @Command({
      name: 'serve'
    })
    class TestCommand {
      @Positional({}) port!: number;
    }

    const test = new TestCommand();

    expect(Reflector.getDesignType(test, 'port')).toBe(Number);
  });
});