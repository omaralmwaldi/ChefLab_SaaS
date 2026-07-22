// Applied-filter shape for the recipe list. The tracer proves the pipeline
// with `categoryId`; later dimensions (sku, status, createdBy, shelfLifePlace,
// q) plug into the same object, count, and persistence.
export const EMPTY_FILTERS = {
  q: "",
  sku: "",
  categoryId: [],
  status: "",
  createdBy: "",
  shelfLifePlace: [],
};

const STORAGE_KEY = "recipeFilters";

// Active-filter count = length of each multi-select array plus each non-empty
// scalar. Drives the Filter button badge.
export function countActiveFilters(filters) {
  return Object.values(filters).reduce((total, value) => {
    if (Array.isArray(value)) return total + value.length;
    return total + (value ? 1 : 0);
  }, 0);
}

// Persist across list unmount/remount so filters survive navigating into a
// recipe and back.
export function loadFilters() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_FILTERS };
    return { ...EMPTY_FILTERS, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_FILTERS };
  }
}

export function saveFilters(filters) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // ignore storage failures (private mode, quota)
  }
}
