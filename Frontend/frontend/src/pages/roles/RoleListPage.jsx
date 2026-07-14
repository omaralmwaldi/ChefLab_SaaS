import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import client from "../../api/client";
import RoleModal from "./components/RoleModal";
import DeleteConfirm from "../../components/DeleteConfirm";
import Can from "../../components/Can";
import { PERMISSIONS } from "../../constants/permissions";
import { pick } from "../../utils/pick";

const totalPermissions = 20;

function RoleListPage() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language === "ar" ? "ar" : "en";
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    client.get("/roles")
      .then((res) => { if (!cancelled) setRoles(res.data); })
      .catch(() => { if (!cancelled) setError(t("roles.errorLoad")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function reload() {
    client.get("/roles")
      .then((res) => setRoles(res.data))
      .catch(() => setError(t("roles.errorLoad")));
  }

  function handleCreated() { setModal(null); reload(); }
  function handleUpdated() { setModal(null); reload(); }
  function handleDeleted() { setDeleteTarget(null); reload(); }

  function countPermissions(perms) {
    if (!perms) return 0;
    return Object.values(perms).filter(Boolean).length;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-300 border-t-orange-500" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-stone-500">{t("roles.count", { count: roles.length })}</p>
        <Can permission={PERMISSIONS.ROLES_CREATE}>
          <button
            onClick={() => setModal("create")}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t("roles.addRole")}
          </button>
        </Can>
      </div>

      {roles.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="text-stone-400">{t("roles.noRoles")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const count = countPermissions(role.permissions);
            return (
              <div key={role.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-stone-800">{pick(role, "name", lang)}</h3>
                  </div>
                </div>

                <div className="mt-4">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    count === totalPermissions
                      ? "bg-green-100 text-green-700"
                      : count === 0
                        ? "bg-stone-100 text-stone-500"
                        : "bg-orange-100 text-orange-700"
                  }`}>
                    {t("roles.permissionCount", { count, total: totalPermissions })}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-1 border-t border-stone-100 pt-3">
                  <Can permission={PERMISSIONS.ROLES_EDIT}>
                    <button
                      onClick={() => setModal(role)}
                      className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-orange-600"
                      title={t("common.edit")}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  </Can>
                  <Can permission={PERMISSIONS.ROLES_DELETE}>
                    <button
                      onClick={() => setDeleteTarget(role)}
                      className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-600"
                      title={t("common.delete")}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </Can>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal === "create" && (
        <RoleModal mode="create" onClose={() => setModal(null)} onSuccess={handleCreated} />
      )}
      {modal && modal !== "create" && (
        <RoleModal mode="edit" initialData={modal} onClose={() => setModal(null)} onSuccess={handleUpdated} />
      )}
      {deleteTarget && (
        <DeleteConfirm
          apiUrl={`/roles/${deleteTarget.id}`}
          name={deleteTarget.nameEn}
          title={t("roles.deleteRole")}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleDeleted}
        />
      )}
    </div>
  );
}

export default RoleListPage;
