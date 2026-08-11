import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notificationApi";

const NotificationContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_NOTIFICATION_SOCKET_URL || "http://localhost:3006";

export const NotificationProvider = ({ children }) => {
  const { auth } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    if (!auth?.accessToken) return;
    setLoading(true);
    try {
      const [{ data: listData }, { data: countData }] = await Promise.all([
        getNotifications(1, 15),
        getUnreadNotificationCount(),
      ]);
      setNotifications(listData.notifications || []);
      setUnreadCount(countData.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  }, [auth?.accessToken]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!auth?.accessToken) {
      setNotifications([]);
      setUnreadCount(0);
      setConnected(false);
      socketRef.current?.disconnect();
      socketRef.current = null;
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: { token: auth.accessToken },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("notification:new", (notification) => {
      setNotifications((current) => [notification, ...current.filter((item) => item._id !== notification._id)].slice(0, 15));
      setUnreadCount((current) => current + 1);
      toast(notification.title || "New notification");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [auth?.accessToken]);

  const markRead = useCallback(async (notificationId) => {
    const { data } = await markNotificationAsRead(notificationId);
    setNotifications((current) =>
      current.map((item) => (item._id === notificationId ? data.notification : item))
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }))
    );
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connected,
        loading,
        refreshNotifications,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
};
