import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!roles?.length) return true;
    const { user } = ctx.switchToHttp().getRequest();
    const normalizeRole = (role?: string) => {
      const raw = String(role || '').trim().toLowerCase();
      const normalized = raw.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      if (['manager', 'reporting_manager', 'reporting-manager', 'reporting manager'].includes(normalized)) return 'reporting_manager';
      if (['project_manager', 'project-manager', 'project manager'].includes(normalized)) return 'project_manager';
      if (['hr', 'hr_manager', 'hr-manager', 'hr manager', 'human_resource', 'human_resources', 'human-resource', 'human-resources'].includes(normalized)) return 'hr_manager';
      if (['ca', 'chartered_accountant'].includes(normalized)) return 'ca';
      return normalized;
    };
    const normalizedAllowedRoles = roles.map((role) => normalizeRole(role));
    const normalizedUserRole = normalizeRole(user?.role);
    const canAccess = normalizedAllowedRoles.includes(normalizedUserRole);
    if (!user || !canAccess) throw new ForbiddenException('Access denied for your role');
    return true;
  }
}
