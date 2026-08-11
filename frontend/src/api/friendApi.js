import api from "./axiosInstance";

export const searchUsers = (query = "", limit = 12) =>
  api.get(`/v1/friends/users?query=${encodeURIComponent(query)}&limit=${limit}`);

export const sendFriendRequest = (receiverUserId, message = "") =>
  api.post("/v1/friends/requests", { receiverUserId, message });

export const getIncomingFriendRequests = () =>
  api.get("/v1/friends/requests/incoming");

export const getOutgoingFriendRequests = () =>
  api.get("/v1/friends/requests/outgoing");

export const acceptFriendRequest = (requestId) =>
  api.patch(`/v1/friends/requests/${requestId}/accept`);

export const rejectFriendRequest = (requestId) =>
  api.patch(`/v1/friends/requests/${requestId}/reject`);

export const cancelFriendRequest = (requestId) =>
  api.delete(`/v1/friends/requests/${requestId}/cancel`);

export const getFriends = () => api.get("/v1/friends");
