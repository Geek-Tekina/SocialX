import api from "./axiosInstance";

export const uploadMedia = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/v1/media/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getAllMedia = () => api.get("/v1/media/get");

export const deleteMedia = (id) => api.delete(`/v1/media/${id}`);

// Resolve any media IDs (cross-user) → { map: { [id]: { url, mimeType, originalName } } }
export const resolveMediaIds = (ids) =>
  api.get(`/v1/media/resolve?ids=${ids.map(String).join(",")}`);
