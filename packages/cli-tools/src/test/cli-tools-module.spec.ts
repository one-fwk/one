import { Test, TestingModule } from '@one/testing';
import { CliToolsModule } from '../cli-tools.module';

describe('CliToolsModule', () => {
  describe('register', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [CliToolsModule.register({})],
      }).compile();
    });

    describe('');
  });
});
