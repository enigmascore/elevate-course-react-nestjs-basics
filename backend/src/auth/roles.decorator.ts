import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../users/user.entity";

export const ROLES_KEY = "roles";

/** @Roles(UserRole.ADMIN) on an endpoint -> 403 for everyone else. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
