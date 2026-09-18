import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { ApiError } from '@/lib/errors';
import type { UserRole } from '@/lib/types';

export interface AuthContext {
  user: any;
  profile: {
    id: string;
    role: UserRole;
    is_active: boolean;
    full_name: string | null;
  };
}

/**
 * Verify the current user is authenticated and has an active profile.
 * Returns the user and profile, or throws ApiError.
 */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) throw ApiError.unauthorized();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, is_active, full_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) throw ApiError.unauthorized('Profile not found');
  if (!profile.is_active) throw ApiError.forbidden('Account deactivated');

  return { user, profile };
}

/**
 * Require specific role(s) for admin/staff access.
 * Throws 403 if user doesn't have required role.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthContext> {
  const auth = await requireAuth();

  if (!allowedRoles.includes(auth.profile.role)) {
    throw ApiError.forbidden('Insufficient permissions');
  }

  return auth;
}

/**
 * Require staff role (admin, super_admin, sales, instructor).
 * Used for staff portal pages and admin APIs.
 */
export async function requireStaff(): Promise<AuthContext> {
  return requireRole(['super_admin', 'admin', 'sales', 'instructor']);
}

/**
 * Require super_admin role.
 * Used for sensitive operations like audit logs, user management.
 */
export async function requireSuperAdmin(): Promise<AuthContext> {
  return requireRole(['super_admin']);
}

/**
 * Require admin or super_admin role.
 * Used for user management, staff creation.
 */
export async function requireAdmin(): Promise<AuthContext> {
  return requireRole(['super_admin', 'admin']);
}

/**
 * Get admin client for service-role operations.
 * Use sparingly - only for operations that need to bypass RLS.
 */
export function getAdminClient() {
  return createAdminClient();
}