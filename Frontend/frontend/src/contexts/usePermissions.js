import { useAuth } from "./useAuth";

// Derives the permission layer from the auth user loaded by AuthProvider via
// /auth/me (on app init and session restore). No separate fetch — freshness
// rides on the same reload, so a role change an admin makes takes effect on the
// user's next reload without logging out.
//
// can(key) = isOwner || set.has(key)
export function usePermissions() {
  const { user, loading } = useAuth();

  const isOwner = !!user?.isOwner;
  const permissions = new Set(
    Array.isArray(user?.permissions) ? user.permissions : []
  );
  const can = (key) => isOwner || permissions.has(key);

  return { can, isOwner, permissions, loading };
}
