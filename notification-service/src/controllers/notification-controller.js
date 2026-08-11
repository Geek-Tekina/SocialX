const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const listNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    const recipientUserId = req.user.userId;
    const filter = { recipientUserId };
    if (req.query.isRead === "true") filter.isRead = true;
    if (req.query.isRead === "false") filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipientUserId, isRead: false }),
    ]);

    return res.json({
      success: true,
      notifications,
      page,
      limit,
      total,
      unreadCount,
    });
  } catch (error) {
    logger.error("Error listing notifications", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching notifications",
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipientUserId: req.user.userId,
      isRead: false,
    });

    return res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    logger.error("Error fetching unread count", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching unread count",
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification id",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipientUserId: req.user.userId,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      notification,
    });
  } catch (error) {
    logger.error("Error marking notification as read", error);
    return res.status(500).json({
      success: false,
      message: "Error updating notification",
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipientUserId: req.user.userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return res.json({
      success: true,
      updatedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    logger.error("Error marking notifications as read", error);
    return res.status(500).json({
      success: false,
      message: "Error updating notifications",
    });
  }
};

module.exports = {
  listNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
