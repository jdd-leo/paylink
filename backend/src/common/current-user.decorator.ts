import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type UserRole = 'ROOT' | 'CREATOR';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
