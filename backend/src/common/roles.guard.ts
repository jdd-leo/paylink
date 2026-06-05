import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthUser } from './current-user.decorator';

@Injectable()
export class RootGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user as AuthUser | undefined;
    if (user?.role !== 'ROOT') {
      throw new ForbiddenException('Acesso restrito ao administrador');
    }
    return true;
  }
}
