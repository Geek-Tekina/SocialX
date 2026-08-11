import api from "./axiosInstance";

export const getNotifications = (page = 1, limit = 15) =>
  api.get(`/v1/notifications?page=${page}&limit=${limit}`);

export const getUnreadNotificationCount = () =>
  api.get("/v1/notifications/unread-count");

export const markNotificationAsRead = (notificationId) =>
  api.patch(`/v1/notifications/${notificationId}/read`);

export const markAllNotificationsAsRead = () =>
  api.patch("/v1/notifications/read-all");
