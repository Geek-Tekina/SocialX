const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");
const { emitNotification, setSocketServer } = require("../utils/notificationHub");

const authenticateSocket = (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "") ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new Error("Socket auth is not configured"));
    }

    const payload = jwt.verify(token, secret);
    const userId = payload.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return next(new Error("Invalid token payload"));
    }

    socket.userId = userId;
    next();
  } catch (error) {
    return next(new Error("Unauthorized socket connection"));
  }
};

const buildNotificationBody = (eventType, event) => {
  switch (eventType) {
    case "created":
      return {
        recipientUserId: event.receiverUserId,
        actorUserId: event.senderUserId,
        type: "friend_request_received",
        entityType: "friend_request",
        entityId: event.friendRequestId,
        title: "New friend request",
        body: "You received a new friend request.",
      };
    case "accepted":
      return {
        recipientUserId: event.senderUserId,
        actorUserId: event.receiverUserId,
        type: "friend_request_accepted",
        entityType: "friend_request",
        entityId: event.friendRequestId,
        title: "Friend request accepted",
        body: "Your friend request was accepted.",
      };
    case "rejected":
      return {
        recipientUserId: event.senderUserId,
        actorUserId: event.receiverUserId,
        type: "friend_request_rejected",
        entityType: "friend_request",
        entityId: event.friendRequestId,
        title: "Friend request rejected",
        body: "Your friend request was rejected.",
      };
    case "cancelled":
      return {
        recipientUserId: event.receiverUserId,
        actorUserId: event.senderUserId,
        type: "friend_request_cancelled",
        entityType: "friend_request",
        entityId: event.friendRequestId,
        title: "Friend request cancelled",
        body: "A friend request was cancelled.",
      };
    default:
      return null;
  }
};

const createNotification = async (eventType, event) => {
  const payload = buildNotificationBody(eventType, event);
  if (!payload) return null;

  const eventId = event.eventId || `${event.friendRequestId}:${eventType}:${event.occurredAt || Date.now()}`;

  try {
    const notification = await Notification.create({
      ...payload,
      eventId,
      metadata: {
        friendRequestId: event.friendRequestId,
        status: event.status,
        originalEventType: eventType,
        message: event.message || "",
      },
    });

    const plainNotification = notification.toObject();
    emitNotification(notification.recipientUserId.toString(), plainNotification);
    return notification;
  } catch (error) {
    if (error.code === 11000) {
      logger.info(`Skipping duplicate notification event ${eventId}`);
      return Notification.findOne({ eventId });
    }

    throw error;
  }
};

const handleFriendRequestCreated = async (event) => {
  try {
    await createNotification("created", event);
    logger.info(`Notification created for friend.request.created ${event.friendRequestId}`);
  } catch (error) {
    logger.error("Error handling friend request created event", error);
    throw error;
  }
};

const handleFriendRequestAccepted = async (event) => {
  try {
    await createNotification("accepted", event);
    logger.info(`Notification created for friend.request.accepted ${event.friendRequestId}`);
  } catch (error) {
    logger.error("Error handling friend request accepted event", error);
    throw error;
  }
};

const handleFriendRequestRejected = async (event) => {
  try {
    await createNotification("rejected", event);
    logger.info(`Notification created for friend.request.rejected ${event.friendRequestId}`);
  } catch (error) {
    logger.error("Error handling friend request rejected event", error);
    throw error;
  }
};

const handleFriendRequestCancelled = async (event) => {
  try {
    await createNotification("cancelled", event);
    logger.info(`Notification created for friend.request.cancelled ${event.friendRequestId}`);
  } catch (error) {
    logger.error("Error handling friend request cancelled event", error);
    throw error;
  }
};

module.exports = {
  handleFriendRequestCreated,
  handleFriendRequestAccepted,
  handleFriendRequestRejected,
  handleFriendRequestCancelled,
  setSocketServer,
  authenticateSocket,
};
