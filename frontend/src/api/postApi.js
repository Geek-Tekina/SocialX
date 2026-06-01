import api from "./axiosInstance";

export const createPost = (data) => api.post("/v1/posts/create-post", data);

export const getAllPosts = (page = 1, limit = 10) =>
  api.get(`/v1/posts/all-posts?page=${page}&limit=${limit}`);

export const getPostById = (id) => api.get(`/v1/posts/${id}`);

export const toggleLikePost = (id) => api.patch(`/v1/posts/${id}/like`);

export const addPostComment = (id, content) =>
  api.post(`/v1/posts/${id}/comments`, { content });

export const deletePost = (id) => api.delete(`/v1/posts/${id}`);
