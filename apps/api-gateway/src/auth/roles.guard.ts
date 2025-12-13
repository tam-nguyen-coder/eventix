import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '@eventix/shared-constants';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        // Assuming Auth0 adds roles to the token payload under a custom namespace or directly
        // This logic might need adjustment based on specific Auth0 rule/action configuration
        const userRoles = user['http://eventix/roles'] || user.roles || [];

        return requiredRoles.some((role) => userRoles.includes(role));
    }
}
