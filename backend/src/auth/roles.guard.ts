import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../users/user.entity";
import type { AuthenticatedUser } from "./jwt.strategy";
import { ROLES_KEY } from "./roles.decorator";

/**
 * Role-based HALF of the permission story; the OWNERSHIP half ( "your
 * own posts only" ) lives in the services, where the row is loaded.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const user: AuthenticatedUser | undefined = context.switchToHttp().getRequest().user;
    return !!user && required.includes(user.role as UserRole);
  }
}
