import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { Circle, DoneAll, Notifications, NotificationsNone } from "@mui/icons-material";
import { useState } from "react";
import { useNotifications } from "../context/NotificationContext";
import { formatDistanceToNow } from "../utils/dateUtils";

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    connected,
    loading,
    markRead,
    markAllRead,
    refreshNotifications,
  } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);

  const openMenu = (event) => {
    setAnchorEl(event.currentTarget);
    refreshNotifications();
  };

  return (
    <>
      <Tooltip title={connected ? "Notifications live" : "Notifications"}>
        <IconButton onClick={openMenu} size="small" sx={{ mr: 0.75, color: "text.secondary" }}>
          <Badge badgeContent={unreadCount} color="error" max={9}>
            {unreadCount > 0 ? <Notifications fontSize="small" /> : <NotificationsNone fontSize="small" />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ sx: { mt: 0.75, width: 340, maxWidth: "calc(100vw - 24px)", borderRadius: 2, border: "1px solid", borderColor: "divider" } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={800}>Notifications</Typography>
            <Typography variant="caption" color="text.secondary">
              {connected ? "Live updates connected" : "Showing latest updates"}
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Button size="small" startIcon={<DoneAll fontSize="small" />} onClick={markAllRead}>
              Read all
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
            <NotificationsNone sx={{ color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {loading ? "Loading notifications..." : "No notifications yet"}
            </Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => {
                if (!notification.isRead) markRead(notification._id);
              }}
              sx={{ alignItems: "flex-start", gap: 1, py: 1.25, whiteSpace: "normal" }}
            >
              <ListItemIcon sx={{ minWidth: 20, pt: 0.45 }}>
                {!notification.isRead && <Circle sx={{ fontSize: 8, color: "error.main" }} />}
              </ListItemIcon>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={notification.isRead ? 500 : 800}>
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.45 }}>
                  {notification.body}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatDistanceToNow(notification.createdAt)}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
