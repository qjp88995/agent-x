import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';

function createMockContext(user?: { role?: string }): ExecutionContext {
  const request = { user };
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no @Roles() decorator is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext({ role: 'USER' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when @Roles() has empty array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

    const context = createMockContext({ role: 'USER' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow ADMIN when @Roles("ADMIN") is set', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(['ADMIN'])
      .mockReturnValueOnce(false);

    const context = createMockContext({ role: 'ADMIN' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny USER when @Roles("ADMIN") is set', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(['ADMIN'])
      .mockReturnValueOnce(false);

    const context = createMockContext({ role: 'USER' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access on @Public() routes even with @Roles()', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(['ADMIN'])
      .mockReturnValueOnce(true);

    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny when no user is present', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(['ADMIN'])
      .mockReturnValueOnce(false);

    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
