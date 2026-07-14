import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import client from "../../api/client";
import { useAuth } from "../../contexts/useAuth";
import UserModal from "./components/UserModal";
import NewPasswordDialog from "./components/NewPasswordDialog";
import DeleteConfirm from "../../components/DeleteConfirm";
import Can from "../../components/Can";
import { PERMISSIONS } from "../../constants/permissions";
import { pick } from "../../utils/pick";

function UserListPage() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language === "ar" ? "ar" : "en";
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    client.get("/users")
      .then((res) => { if (!cancelled) setUsers(res.data); })
      .catch(() => { if (!cancelled) setError(t("users.errorLoad")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function reload() {
    client.get("/users")
      .then((res) => setUsers(res.data))
      .catch(() => setError(t("users.errorLoad")));
  }

  function handleCreated() { setModal(null); reload(); }
  function handleUpdated() { setModal(null); reload(); }
  function handlePasswordChanged() { setPasswordTarget(null); reload(); }
  function handleDeleted() { setDeleteTarget(null); reload(); }

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
        <p className="text-sm text-stone-500">{t("users.count", { count: users.length })}</p>
        <Can permission={PERMISSIONS.USERS_CREATE}>
          <button
            onClick={() => setModal("create")}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t("users.addUser")}
          </button>
        </Can>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="text-stone-400">{t("users.noUsers")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <ul className="divide-y divide-stone-100">
            {users.map((u) => {
              const isSelf = currentUser?.id === u.id;
              const initials = (u.name || u.email || "?").trim().charAt(0).toUpperCase();
              return (
                <li key={u.id} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-stone-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-600">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-stone-800">{u.name}</p>
                      {isSelf && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-stone-500">
                          {t("users.you")}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-stone-500">{u.email}</p>
                  </div>

                  <div className="hidden sm:block">
                    {u.role ? (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                        {pick(u.role, "name", lang)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">
                        {t("users.noRole")}
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Can permission={PERMISSIONS.USERS_EDIT}>
                      <button
                        onClick={() => setModal(u)}
                        className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-orange-600"
                        title={t("common.edit")}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                    </Can>
                    <Can permission={PERMISSIONS.USERS_EDIT}>
                      <button
                        onClick={() => setPasswordTarget(u)}
                        className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-orange-600"
                        title={t("users.setNewPassword")}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                        </svg>
                      </button>
                    </Can>
                    <Can permission={PERMISSIONS.USERS_DELETE}>
                      <button
                        onClick={() => !isSelf && setDeleteTarget(u)}
                        disabled={isSelf}
                        className={`rounded-lg p-1.5 ${
                          isSelf
                            ? "cursor-not-allowed text-stone-200"
                            : "cursor-pointer text-stone-400 hover:bg-stone-100 hover:text-red-600"
                        }`}
                        title={isSelf ? t("users.cannotDeleteSelf") : t("common.delete")}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </Can>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {modal === "create" && (
        <UserModal mode="create" onClose={() => setModal(null)} onSuccess={handleCreated} />
      )}
      {modal && modal !== "create" && (
        <UserModal mode="edit" initialData={modal} onClose={() => setModal(null)} onSuccess={handleUpdated} />
      )}
      {passwordTarget && (
        <NewPasswordDialog
          user={passwordTarget}
          onClose={() => setPasswordTarget(null)}
          onSuccess={handlePasswordChanged}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          apiUrl={`/users/${deleteTarget.id}`}
          name={deleteTarget.name}
          title={t("users.deleteUser")}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleDeleted}
        />
      )}
    </div>
  );
}

export default UserListPage;
