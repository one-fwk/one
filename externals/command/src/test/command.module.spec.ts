import { Test, TestingModule } from '@one/testing';
import { CommandModule } from '../command.module';

describe('CommandModule', () => {
  describe('register', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [CommandModule.register({})],
      }).compile();
    });

    describe('');
  });
});
