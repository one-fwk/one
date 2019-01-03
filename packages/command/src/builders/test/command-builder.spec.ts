import { CommandBuilder } from '../command-builder';
import { Positional, Option } from '../../decorators';

jest.mock('yargs', () => ({
  command() {}
}));

describe('CommandBuilder', () => {
  let commandBuilder: any;

  class TestCommand {
    @Positional()
    species!: string;

    @Option()
    dead!: boolean;

    @Option()
    count!: number;

    @Positional()
    types!: any[];
  }

  beforeEach(() => {
    commandBuilder = new CommandBuilder(
      new TestCommand(),
      { name: 'any' },
    );
  });

  describe('createMetadata', () => {
    it('should return type from design:type if type does not exist', () => {
      const speciesMetadata = commandBuilder.createMetadata('species', {});
      expect(speciesMetadata).toHaveProperty('type');
      expect(speciesMetadata.type).toEqual('string');

      const deadMetadata = commandBuilder.createMetadata('dead', {});
      expect(deadMetadata.type).toEqual('boolean');

      const countMetadata = commandBuilder.createMetadata('count', {});
      expect(countMetadata.type).toEqual('number');

      const typesMetadata = commandBuilder.createMetadata('types', {});
      expect(typesMetadata.type).toEqual('array');
    });

    it('should return name from propertyKey if name does not exist', () => {
      const speciesMetadata = commandBuilder.createMetadata('species', {});
      expect(speciesMetadata).toHaveProperty('name');
      expect(speciesMetadata.name).toEqual('species');
    });
  });
});