import { Reflector, TransientScope, Scopes, SCOPE_METADATA } from '@one/core';

describe('@TransientScope()', () => {
  it('should define metadata scope as transient', () => {
    @TransientScope()
    class Test {}

    const scope = Reflector.get(SCOPE_METADATA, Test);
    expect(scope).toEqual(Scopes.TRANSIENT);
  });
});
