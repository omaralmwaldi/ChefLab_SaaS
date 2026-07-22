import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import client from "../../../api/client";
import { pick } from "../../../utils/pick";
import { EMPTY_FILTERS } from "./recipeFilters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Radix Select forbids an empty-string item value, so the "any" option carries
// a sentinel that maps back to "" in the applied-filter shape.
const ANY = "__any__";

const SHELF_LIFE_PLACES = [
  { value: "ROOM_TEMPERATURE", key: "roomTemperature" },
  { value: "CHILLER", key: "chiller" },
  { value: "FREEZER", key: "freezer" },
];

// Filter modal shell. Local draft holds all criteria; Apply lifts the draft to
// the parent, Reset returns the full list, Cancel discards. Category proves the
// pipeline the later dimensions plug into.
function RecipeFilterModal({ initial, onApply, onReset, onClose }) {
  const { t, i18n } = useTranslation("recipes");
  const lang = i18n.language === "ar" ? "ar" : "en";
  const [q, setQ] = useState(initial.q ?? "");
  const [sku, setSku] = useState(initial.sku ?? "");
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? []);
  const [status, setStatus] = useState(initial.status ?? "");
  const [createdBy, setCreatedBy] = useState(initial.createdBy ?? "");
  const [shelfLifePlace, setShelfLifePlace] = useState(
    initial.shelfLifePlace ?? [],
  );
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([client.get("/categories"), client.get("/recipes/authors")])
      .then(([catRes, authorRes]) => {
        if (!cancelled) {
          setCategories(catRes.data);
          setAuthors(authorRes.data);
        }
      })
      .catch(() => {
        if (!cancelled) setError(t("errorLoadCategories"));
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  function toggleCategory(id) {
    setCategoryId((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleShelfLifePlace(place) {
    setShelfLifePlace((prev) =>
      prev.includes(place)
        ? prev.filter((x) => x !== place)
        : [...prev, place],
    );
  }

  function handleApply() {
    onApply({
      q: q.trim(),
      sku: sku.trim(),
      categoryId,
      status,
      createdBy,
      shelfLifePlace,
    });
  }

  function handleReset() {
    setQ(EMPTY_FILTERS.q);
    setSku(EMPTY_FILTERS.sku);
    setCategoryId([...EMPTY_FILTERS.categoryId]);
    setStatus(EMPTY_FILTERS.status);
    setCreatedBy(EMPTY_FILTERS.createdBy);
    setShelfLifePlace([...EMPTY_FILTERS.shelfLifePlace]);
    onReset();
  }

  return (
    <Dialog defaultOpen onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-md">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{t("filterTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6">
          {error && (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="filter-name">{t("filterName")}</Label>
            <Input
              id="filter-name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("filterNamePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-sku">{t("filterSku")}</Label>
            <Input
              id="filter-sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder={t("filterSkuPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("category")}</Label>
            {loadingData ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground rounded-lg border px-3 py-2.5 text-sm">
                {t("selectCategory")}
              </p>
            ) : (
              <div className="max-h-56 space-y-1 overflow-auto rounded-lg border p-2">
                {categories.map((c) => {
                  const id = `cat-${c.id}`;
                  return (
                    <Label
                      key={c.id}
                      htmlFor={id}
                      className="hover:bg-accent rounded-md px-2 py-1.5 font-normal"
                    >
                      <Checkbox
                        id={id}
                        checked={categoryId.includes(c.id)}
                        onCheckedChange={() => toggleCategory(c.id)}
                      />
                      {pick(c, "name", lang)}
                    </Label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-status">{t("filterStatus")}</Label>
            <Select
              value={status || ANY}
              onValueChange={(v) => setStatus(v === ANY ? "" : v)}
            >
              <SelectTrigger id="filter-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{t("filterStatusAny")}</SelectItem>
                <SelectItem value="DRAFT">{t("draft")}</SelectItem>
                <SelectItem value="CLOSED">{t("closed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-author">{t("filterCreatedBy")}</Label>
            <Select
              value={createdBy || ANY}
              onValueChange={(v) => setCreatedBy(v === ANY ? "" : v)}
            >
              <SelectTrigger id="filter-author" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{t("filterCreatedByAny")}</SelectItem>
                {authors.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("filterShelfLifePlace")}</Label>
            <div className="space-y-1 rounded-lg border p-2">
              {SHELF_LIFE_PLACES.map((p) => {
                const id = `shelf-${p.value}`;
                return (
                  <Label
                    key={p.value}
                    htmlFor={id}
                    className="hover:bg-accent rounded-md px-2 py-1.5 font-normal"
                  >
                    <Checkbox
                      id={id}
                      checked={shelfLifePlace.includes(p.value)}
                      onCheckedChange={() => toggleShelfLifePlace(p.value)}
                    />
                    {t(p.key)}
                  </Label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="bg-background sticky bottom-0 mt-5 flex-row justify-between gap-3 border-t px-6 py-4 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              handleReset();
              onClose();
            }}
          >
            {t("reset")}
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={handleApply} disabled={loadingData}>
              {t("apply")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RecipeFilterModal;
