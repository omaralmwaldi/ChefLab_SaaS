export function pick(entity, field, lang) {
  if (!entity) return "";
  if (lang === "ar") {
    return entity[field + "Ar"] || entity[field + "En"] || "";
  }
  return entity[field + "En"] || "";
}
