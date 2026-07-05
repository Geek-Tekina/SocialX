import api from "./axiosInstance";

export const registerUser = (data) => api.post("/v1/auth/register", data);

export const loginUser = (data) => api.post("/v1/auth/login", data);

export const googleAuth = (credential) =>
  api.post("/v1/auth/google", { credential });

export const refreshToken = (refreshToken) =>
  api.post("/v1/auth/refresh-token", { refreshToken });

export const logoutUser = (refreshToken) =>
  api.post("/v1/auth/logout", { refreshToken });
