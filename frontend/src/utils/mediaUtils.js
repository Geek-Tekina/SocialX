export const normalizeMediaId = (id) => {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (typeof id === "object" && id._id) return String(id._id);
  return String(id);
};

export const normalizeMediaIds = (ids) =>
  (Array.isArray(ids) ? ids : [])
    .map(normalizeMediaId)
    .filter(Boolean);

export const normalizeMediaMap = (map = {}) =>
  Object.entries(map || {}).reduce((acc, [id, value]) => {
    const mediaId = normalizeMediaId(id);
    const url = typeof value === "string" ? value : value?.url;
    if (mediaId && url) acc[mediaId] = url;
    return acc;
  }, {});
