import api from "./axiosInstance";

export const searchPosts = (query) =>
  api.get(`/v1/search/posts?query=${encodeURIComponent(query)}`);
