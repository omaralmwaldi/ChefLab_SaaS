import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import client from "../../api/client";
import { exportIngredients, importIngredients } from "../../api/ingredients";
import IngredientModal from "./components/IngredientModal";
import DeleteConfirm from "../../components/DeleteConfirm";
import Pagination from "../../components/Pagination";
import { pick } from "../../utils/pick";

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 250;

function TableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-100 bg-stone-50">
            <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">SKU</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">Name</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">Units</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">Cost / Unit</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-b border-stone-100 last:border-0">
              {Array.from({ length: 5 }).map((_, j) => (
                <td key={j} className="px-4 py-3.5">
                  <div
                    className={`animate-pulse rounded bg-stone-200 ${j === 0 ? "h-4 w-16" : j === 4 ? "h-4 w-12" : "h-4 w-24"}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IngredientListPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === "ar" ? "ar" : "en";
  const [searchParams, setSearchParams] = useSearchParams();

  const rawPage = parseInt(searchParams.get("page"), 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const query = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(query);
  const [ingredients, setIngredients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);

  const fileInputRef = useRef(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const [syncedQuery, setSyncedQuery] = useState(query);

  if (syncedQuery !== query) {
    setSyncedQuery(query);
    setSearchInput(query);
  }

  const fetchData = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const params = { paginated: 1, page, pageSize: PAGE_SIZE };
      if (query) params.q = query;
      const res = await client.get("/ingredients", { params, signal });
      if (!signal?.aborted) {
        setIngredients(res.data.data);
        setTotal(res.data.total);
      }
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        setError("Failed to load ingredients");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(controller.signal), DEBOUNCE_MS);

    return () => {
      controller.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchData]);

  function handleSearch(e) {
    e.preventDefault();
    const trimmed = searchInput.trim();
    const params = {};
    if (trimmed) params.q = trimmed;
    setSearchParams(params);
  }

  function handlePageChange(newPage) {
    const params = {};
    if (query) params.q = query;
    if (newPage > 1) params.page = String(newPage);
    setSearchParams(params);
  }

  function reload() {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchData(controller.signal);
  }

  function handleCreated() { setModal(null); reload(); }
  function handleUpdated() { setModal(null); reload(); }
  function handleDeleted() { setDeleteTarget(null); reload(); }

  function formatCost(cost, unit) {
    const num = Number(cost);
    return `SAR${num.toFixed(2)}/${unit}`;
  }

  async function handleExport() {
    setImportError(null);
    try {
      const blob = await exportIngredients();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ingredients-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setImportError(
        err.response?.data?.message || err.message || "Export failed",
      );
    }
  }

  function triggerImport() {
    setImportError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    try {
      const result = await importIngredients(file);
      setImportResult(result);
      reload();
    } catch (err) {
      const data = err.response?.data;
      let msg = data?.message || err.message || "Import failed";
      if (data?.missingColumns?.length) {
        msg += `: ${data.missingColumns.join(", ")}`;
      }
      if (data?.duplicateSku) {
        msg += ` ("${data.duplicateSku}")`;
      }
      setImportError(msg);
    } finally {
      setImporting(false);
    }
  }

  const isSearchResult = query.length > 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-72 rounded-lg border border-stone-200 px-3 py-2 pr-10 text-sm outline-none placeholder:text-stone-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(""); setSearchParams({}); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-stone-400 hover:text-stone-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleFileChosen}
          />
          <button
            onClick={triggerImport}
            disabled={importing}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {importing ? "Importing..." : "Import"}
          </button>
          <button
            onClick={handleExport}
            disabled={importing}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25L12 3m0 0l4.5 5.25M12 3v13.5" />
            </svg>
            Export
          </button>
          <button
            onClick={() => setModal("create")}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Ingredient
          </button>
        </div>
      </div>

      {!loading && !error && total > 0 && (
        <p className="mb-4 text-sm text-stone-500">
          {total} ingredient{total !== 1 ? "s" : ""}
          {isSearchResult && " found"}
        </p>
      )}

      {importing && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-orange-500" />
          Importing file...
        </div>
      )}

      {importResult && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
          importResult.errors?.length > 0
            ? "border-orange-200 bg-orange-50 text-orange-800"
            : "border-green-200 bg-green-50 text-green-800"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                Imported: {importResult.created} created, {importResult.updated} updated.
                {importResult.errors?.length > 0
                  ? ` ${importResult.errors.length} row(s) failed.`
                  : ""}
              </p>
              {importResult.errors?.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium underline">
                    View errors
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded bg-white/70 p-2 text-xs text-stone-700">
                    {JSON.stringify(importResult.errors, null, 2)}
                  </pre>
                </details>
              )}
            </div>
            <button
              onClick={() => setImportResult(null)}
              className="cursor-pointer rounded p-1 text-current hover:bg-black/5"
              title="Dismiss"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {importError && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{importError}</p>
          <button
            onClick={() => setImportError(null)}
            className="cursor-pointer rounded p-1 text-red-700 hover:bg-red-100"
            title="Dismiss"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {loading && <TableSkeleton />}

      {!loading && error && (
        <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-12 shadow-sm">
          <p className="text-stone-500">{error}</p>
          <button
            onClick={reload}
            className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && total === 0 && !isSearchResult && (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="text-stone-400">No ingredients available.</p>
        </div>
      )}

      {!loading && !error && total === 0 && isSearchResult && (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="text-stone-400">No ingredients found.</p>
        </div>
      )}

      {!loading && !error && total > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">SKU</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">Name</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">Units</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">Cost / Unit</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-stone-400">
                      No ingredients found.
                    </td>
                  </tr>
                ) : (
                  ingredients.map((ing) => (
                    <tr key={ing.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-stone-600">{ing.sku}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-medium text-stone-800">{pick(ing, "name", lang)}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-stone-600">{ing.storageUnit} &rarr; {ing.usageUnit}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-stone-700">
                        {formatCost(ing.costPerStorageUnit, ing.storageUnit)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setModal(ing)}
                            className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-orange-600"
                            title="Edit"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(ing)}
                            className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-600"
                            title="Delete"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalItems={total}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {modal === "create" && (
        <IngredientModal mode="create" onClose={() => setModal(null)} onSuccess={handleCreated} />
      )}
      {modal && modal !== "create" && (
        <IngredientModal mode="edit" initialData={modal} onClose={() => setModal(null)} onSuccess={handleUpdated} />
      )}
      {deleteTarget && (
        <DeleteConfirm
          apiUrl={`/ingredients/${deleteTarget.id}`}
          name={deleteTarget.nameEn}
          title="Delete Ingredient"
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleDeleted}
        />
      )}
    </div>
  );
}

export default IngredientListPage;
