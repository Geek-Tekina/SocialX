const express = require("express");
const {
  listNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notification-controller");
const { authenticateRequest } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateRequest);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markNotificationAsRead);
router.patch("/read-all", markAllNotificationsAsRead);

module.exports = router;
