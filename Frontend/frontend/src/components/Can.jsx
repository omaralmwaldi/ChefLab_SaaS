import { usePermissions } from "../contexts/usePermissions";

// Declarative gate: renders children only when the current user holds
// `permission`. Optional `fallback` renders otherwise (defaults to null).
//
//   <Can permission={PERMISSIONS.USERS_CREATE}>
//     <button>New user</button>
//   </Can>
function Can({ permission, children, fallback = null }) {
  const { can } = usePermissions();
  return can(permission) ? children : fallback;
}

export default Can;
